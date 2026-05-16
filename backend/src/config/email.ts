import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export const enviarEmail = async (
  destinatario: string,
  asunto: string,
  html: string
) => {
  await transporter.sendMail({
    from: `"SIVWEB Sistema" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html
  })
}