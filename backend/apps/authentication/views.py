"""
Authentication views for Ecobilda API.
Handles login, registration, and token operations.

Based on: Controllers/AccountController.cs
"""

import secrets
from django.utils import timezone

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

from .serializers import (
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    RegisterSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer
)
from apps.users.serializers import UserSerializer

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that includes user data in response.
    """
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.

    POST /api/auth/register/

    Based on: Controllers/AccountController.cs Register (lines 24-81)
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate email verification token
        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verified = False
        user.email_verification_sent_at = timezone.now()
        user.save(update_fields=['email_verification_token', 'email_verified', 'email_verification_sent_at'])

        # Build verification link
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        # Send verification email
        try:
            email_context = {
                'user_name': user.first_name or user.email,
                'verify_url': verify_url,
                'frontend_url': settings.FRONTEND_URL,
            }
            html_message = render_to_string('emails/auth/verify_email.html', email_context)
            plain_message = render_to_string('emails/auth/verify_email.txt', email_context)
            send_mail(
                subject='Ecobilda - V\u00e9rification de votre adresse email',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("Failed to send verification email to %s: %s", user.email, str(e))

        return Response({
            'message': 'Registration successful. Please check your email to verify your account.',
            'email': user.email,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    Email/password login endpoint.

    POST /api/auth/login/

    Based on: Controllers/AccountController.cs Login (lines 83-135)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # Update last login (Django handles this automatically with authenticate)
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Login successful.'
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Logout endpoint (blacklist refresh token).

    POST /api/auth/logout/

    Note: With JWT, logout is primarily handled client-side by removing tokens.
    This endpoint blacklists the refresh token for additional security.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logout successful.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Request password reset email.

    POST /api/auth/password-reset/

    Based on: Controllers/AccountController.cs ForgotPassword (lines 137-175)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email__iexact=email)

            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Build reset link
            # In production, this should be the frontend URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            # Send password reset email
            email_context = {
                'user_name': user.first_name or user.email,
                'reset_url': reset_url,
                'frontend_url': settings.FRONTEND_URL,
            }
            html_message = render_to_string('emails/auth/password_reset.html', email_context)
            plain_message = render_to_string('emails/auth/password_reset.txt', email_context)
            send_mail(
                subject='Ecobilda - R\u00e9initialisation de mot de passe',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
        except User.DoesNotExist:
            # Don't reveal if email exists (security best practice)
            pass

        # Always return success to prevent email enumeration
        return Response({
            'message': 'If an account exists with this email, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token.

    POST /api/auth/password-reset/confirm/

    Based on: Controllers/AccountController.cs ResetPassword (lines 177-227)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        # Extract UID and token from the token string
        # Expected format: "uid-token"
        try:
            uid, token_part = token.split('-', 1)
            uid_decoded = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=uid_decoded)

            # Validate token
            if default_token_generator.check_token(user, token_part):
                user.set_password(password)
                user.save()
                return Response({
                    'message': 'Password has been reset successfully.'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired reset token.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, User.DoesNotExist):
            return Response({
                'error': 'Invalid reset token.'
            }, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Change password for authenticated user.

    POST /api/auth/change-password/

    Based on: Controllers/AccountController.cs ChangePassword (lines 229-276)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Generate new tokens after password change
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Password changed successfully.',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """
    Get current authenticated user.

    GET /api/auth/me/
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login_view(request):
    """
    Google OAuth login.

    POST /api/auth/google/
    Body: { "access_token": "..." }

    Uses the Google access token to get user info from Google API,
    creates or retrieves the user, and returns JWT tokens.
    """
    import requests as http_requests
    import logging
    logger = logging.getLogger(__name__)

    access_token = request.data.get('access_token')
    if not access_token:
        return Response(
            {'error': 'access_token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Verify token with Google and get user info
        google_userinfo_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = http_requests.get(google_userinfo_url, headers=headers, timeout=5)

        if userinfo_response.status_code != 200:
            return Response(
                {'error': 'Invalid Google access token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        userinfo = userinfo_response.json()

        email = userinfo.get('email')
        if not email:
            return Response(
                {'error': 'Email not provided by Google.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        first_name = userinfo.get('given_name', '')
        last_name = userinfo.get('family_name', '')
        picture_url = userinfo.get('picture', '')

        logger.info(f"[Google OAuth] Email: {email}, picture: {picture_url[:50] if picture_url else 'none'}")

        user, created = User.objects.get_or_create(
            email__iexact=email,
            defaults={
                'email': email.lower(),
                'first_name': first_name,
                'last_name': last_name,
                'is_active': True,
                'email_verified': True,
            }
        )

        if created:
            user.set_unusable_password()
            user.save()
        else:
            # Existing user logging in via Google: verify email if needed
            update_fields = []
            if not user.email_verified:
                user.email_verified = True
                update_fields.append('email_verified')
            # Update name from Google if user has no first/last name
            if not user.first_name and first_name:
                user.first_name = first_name
                update_fields.append('first_name')
            if not user.last_name and last_name:
                user.last_name = last_name
                update_fields.append('last_name')
            if update_fields:
                user.save(update_fields=update_fields)

        # Save Google profile picture as profile_picture_url if user has no picture
        if picture_url and not user.profile_picture:
            # Store the higher-res version of the Google photo
            hi_res_url = picture_url.replace('=s96-c', '=s400-c')
            # Use profile_picture_url if field exists, otherwise skip
            if hasattr(user, 'profile_picture_url'):
                user.profile_picture_url = hi_res_url
                user.save(update_fields=['profile_picture_url'])

        # For returning users with incomplete profile, signal the frontend
        profile_incomplete = not user.date_of_birth

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Google login successful.',
            'created': created or profile_incomplete,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"[Google OAuth] Error: {e}")
        return Response(
            {'error': 'Google authentication failed.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_view(request):
    """
    Verify email address with token.

    POST /api/auth/verify-email/
    Body: { "token": "..." }
    """
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email_verification_token=token)
        user.email_verified = True
        user.email_verification_token = ''
        user.save(update_fields=['email_verified', 'email_verification_token'])

        # Auto-login after verification
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Email verified successfully.',
            'user': UserSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_view(request):
    """
    Check if an email already exists and how the account was created.

    POST /api/auth/check-email/
    Body: { "email": "..." }
    """
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email__iexact=email)
        return Response({
            'exists': True,
            'has_password': user.has_usable_password(),
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'exists': False,
            'has_password': False,
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def apple_login_view(request):
    """
    Apple OAuth login.

    POST /api/auth/apple/

    TODO: Implement with django-allauth in Phase 5
    """
    return Response({
        'error': 'Apple OAuth not yet implemented. Coming in Phase 5.'
    }, status=status.HTTP_501_NOT_IMPLEMENTED)
