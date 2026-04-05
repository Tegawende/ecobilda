// Contact form - for now, this is a no-op since there's no Django backend
// TODO: Implement via Convex action that sends email
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactService = {
  async sendMessage(data: ContactFormData): Promise<void> {
    // TODO: Implement via Convex action
    console.log("Contact form submitted:", data);
  },
};
