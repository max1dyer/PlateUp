/** Body of `POST /contact-messages`: who is writing, how to reply, and what they said. */
export class SendContactMessageDto {
  public readonly name!: string;
  public readonly email!: string;
  public readonly message!: string;
}
