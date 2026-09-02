import { type Request, type Response, Router } from "express";
import nodemailer from "nodemailer";
import Contact, { type IContact } from "../models/Contact.js";

const router = Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function handleContactSubmission(req: Request, res: Response): Promise<void> {
  try {
    const { subject, question } = req.body;

    if (!subject || !question) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const newContact: IContact = new Contact({ subject, question });
    await newContact.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Submission: ${subject}`,
      text: `You received a new message from the FeverFeed contact form.\n\nSubject: ${subject}\nQuestion: ${question}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: "Message saved and email sent successfully!" });
  } catch (error) {
    console.error("Error processing contact submission:", error);
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
}

router.post("/", handleContactSubmission);

export default router;