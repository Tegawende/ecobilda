# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(help_text='Project that was favorited', on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='projects.project')),
                ('user', models.ForeignKey(help_text='User who favorited this project', on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='users.user')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('user', 'project')},
            },
        ),
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['user', '-created_at'], name='favorites_f_user_id_created_idx'),
        ),
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['project'], name='favorites_f_project_id_idx'),
        ),
    ]


