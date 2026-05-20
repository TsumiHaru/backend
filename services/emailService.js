import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.infomaniak.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Erreur configuration email:', error.message);
      return false;
    }
  }

  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Au Fil des Sentiers" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Vérification de votre compte - Au Fil des Sentiers',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2f7a3e; padding: 26px; text-align: center; border-top-left-radius:8px; border-top-right-radius:8px;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight:700;">Au Fil des Sentiers</h1>
          </div>
          
          <div style="padding: 28px; background: #ffffff; border-bottom-left-radius:8px; border-bottom-right-radius:8px; border: 1px solid #e9efe9;">
            <h2 style="color: #333; margin-top: 0;">Bonjour ${name} !</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Merci de vous être inscrit sur Au Fil des Sentiers. Pour activer votre compte et commencer à découvrir 
              les plus beaux sentiers de randonnée, veuillez cliquer sur le bouton ci-dessous :
            </p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="${verificationUrl}" 
                 style="background: #2f7a3e; 
                        color: white; 
                        padding: 12px 26px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 700; 
                        font-size: 15px;
                        display: inline-block;">
                Vérifier mon compte
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :<br>
              <a href="${verificationUrl}" style="color: #2f7a3e; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <div style="background: #f6fff6; padding: 18px; border-radius: 8px; margin: 18px 0; border:1px solid #e6f3ea;">
              <h3 style="color: #2f7a3e; margin-top: 0;">🎯 Que pouvez-vous faire une fois votre compte vérifié ?</h3>
              <ul style="color: #666; line-height: 1.6;">
                <li>Découvrir les événements de randonnée près de chez vous</li>
                <li>Rejoindre des groupes de randonneurs passionnés</li>
                <li>Partager vos propres découvertes</li>
                <li>Planifier vos prochaines aventures</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Ce lien de vérification expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
            </p>
          </div>
          
          <div style="background: #f7faf7; color: #4a4a4a; padding: 16px; text-align: center; font-size: 13px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Au Fil des Sentiers - Découvrez la nature autrement</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error && error.message ? error.message : error);
      if (error && error.rejected) {
        console.error('Rejected recipients:', error.rejected);
      }
      if (error && error.response) {
        console.error('SMTP response:', error.response);
      }
      throw new Error('Erreur lors de l\'envoi de l\'email de vérification');
    }
  }

  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Au Fil des Sentiers" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Au Fil des Sentiers',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: seagreen; padding: 30px; text-align: center;">
            <h1 style="color: black; margin: 0; font-size: 28px;">Au Fil des Sentiers</h1>
            <p style="color: black; margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Bonjour ${name} !</h2>
            
            <p style="color: black; line-height: 1.6; font-size: 16px;">
              Vous avez demandé une réinitialisation de votre mot de passe. 
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: black; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Ce lien expire dans 1 heure pour des raisons de sécurité.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error.message);
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }
}

export default new EmailService();
