const User = require('../models/userModel')
const Recover = require('../models/recoverModel')
const { Resend } = require('resend')
const bcrypt = require('bcrypt')

const generateUniqueCode = () => {
    const code = Math.floor(Math.random() * 900000) + 100000
    return code.toString()
}

const sendUniqueCode = async (req, res) => {
    // console.log('sendUniqueCode')
    const resend = await new Resend(process.env.RESEND_API_KEY)

    try {
        const email = req.body.email

        // check if email exists
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: 'Email not found' })
        }

        // check if this email already has a unique code
        const recoverCheck = await Recover.findOne({ email })
        if (recoverCheck) {
            const now = new Date()
            const created_at = new Date(recoverCheck.created_at)
            const diff = now.getTime() - created_at.getTime()
            const diffMinutes = Math.floor(diff / 60000)
            if (diffMinutes > 2) {
                // filter on Recover to remove the old unique code
                await Recover.deleteOne({ email })
            } else {
                return res.status(404).json({
                    message:
                        'Unique code already created, wait 1 minute for a new one.',
                })
            }
        }

        const unique_code = generateUniqueCode()

        // store unique code in Recover model
        const recoverData = {
            email,
            unique_code,
        }
        const recover = new Recover(recoverData)
        await recover.save()

        const data = await resend.emails.send({
            from: 'Overcome <sender@app-overcome.schr.tech>',
            to: [email],
            subject: '¡Código de recuperación de contraseña! 🙊',
            html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
          <tr>
            <td align="center">
              <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
              <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${email}">${email}</a>:</h1>
              <p style="color: #666666;">Utiliza el código de abajo para recuperar las credenciales de inicio de sesión de tu cuenta de <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a>:</p>
              <h2 style="background-color: #f4f4f4; width:fit-content; padding: 1rem; border-radius:10px;letter-spacing:10px;margin-bottom:30px;margin-top:30px;padding-right:0.6rem">
                ${unique_code}
              </h2>
              <p style="color: ##666666; opacity: 0.7; width: 90%;margin-bottom:20px">
                El código es de un solo uso y expira en 2 minutos, podrás crear uno nuevo luego de este intervalo.
              </p>
              <p style="color: ##666666; opacity: 0.5; font-size:90%; width: 90%">Si no estás tratando de recuperar tus credenciales de inicio de sesión en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a> por favor, ignora este correo electrónico. Es posible que otro usuario haya introducido su información de inicio de sesión de manera incorrecta.</p>
            </td>
          </tr>
        </table>
      `,
        })
        res.status(200).json({ data })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error })
    }
}

const verifyUniqueCode = async (req, res) => {
    try {
        const { email, unique_code } = req.body

        // check if email exists
        const user = await User.findOne({ email })
        if (!user) {
            return res
                .status(404)
                .json({ message: 'Email not found', match: false })
        }

        // check if unique code exists
        const recover = await Recover.findOne({ email })
        if (!recover) {
            return res
                .status(404)
                .json({ message: 'Unique code not found', match: false })
        }

        // check if unique code is correct
        if (recover.unique_code !== unique_code) {
            return res
                .status(401)
                .json({ message: 'Incorrect unique code', match: false })
        }

        // check if code has been already used
        if (recover.is_verified) {
            await Recover.deleteOne({ email })
            return res
                .status(401)
                .json({ message: 'Unique code already verified', match: false })
        }

        // check if unique code has expired
        const now = new Date()
        const created_at = new Date(recover.created_at)
        const diff = now.getTime() - created_at.getTime()
        const diffMinutes = Math.floor(diff / 60000)
        if (diffMinutes > 2) {
            await Recover.deleteOne({ email })
            return res
                .status(401)
                .json({ message: 'Unique code has expired', match: false })
        }

        // Modify the is_verified field to true
        recover.is_verified = true
        await recover.save()

        res.status(200).json({ message: 'Unique code is correct', match: true })
    } catch (error) {
        res.status(500).json({ error })
    }
}

const modifyPassword = async (req, res) => {
    try {
        const { email, unique_code, password } = req.body

        // check if email exists
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: 'Email not found' })
        }

        // check if unique code exists
        const recover = await Recover.findOne({ email })
        if (!recover) {
            return res.status(404).json({ message: 'Unique code not found' })
        }

        // check if unique code is correct
        if (recover.unique_code !== unique_code) {
            return res.status(401).json({ message: 'Incorrect unique code' })
        }

        // check if the unique code is verified
        if (!recover.is_verified) {
            return res.status(401).json({ message: 'Unique code not verified' })
        }

        // modify user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        user.password = hashedPassword
        await user.save()

        // remove recover document
        await Recover.deleteOne({ email })

        res.status(200).json({ message: 'Password modified successfully' })
    } catch (error) {
        res.status(500).json({ error })
    }
}

module.exports = {
    sendUniqueCode,
    verifyUniqueCode,
    modifyPassword,
}
