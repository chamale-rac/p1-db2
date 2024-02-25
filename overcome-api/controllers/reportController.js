const Event = require('../models/eventModel')
const User = require('../models/userModel')
const Report = require('../models/reportModel')
const { Resend } = require('resend')

// Create report
const createReport = async (req, res) => {
    const resend = await new Resend(process.env.RESEND_API_KEY)

    try {
        const report = await Report.create(req.body)

        var reported
        var reportedEmail
        const type = req.body.type

        if (type == 'Event') {
            // Get event title
            reported = await Event.findById(req.body.eventId).populate(
                'creator',
                'email'
            )
            reportedEmail = reported.creator.email
            reported = reported.title
        } else if (type == 'User') {
            // Get user username
            reported = await User.findById(req.body.perpetrator)
            reportedEmail = reported.email
            reported = reported.username
        }

        var reporterEmail = await User.findById(report.reporter).select('email')
        reporterEmail = reporterEmail.email

        // Get report reportSubmit hour
        const reportDate = new Date(report.reportSubmit)

        console.log(reporterEmail)
        const data = await resend.emails.send({
            from: 'Overcome <sender@app-overcome.schr.tech>',
            to: [reporterEmail],
            subject: '¡Detalles de tu reporte! 🆘',
            html: `
            <table width="100%"  cellpadding="0" cellspacing="0"  style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
            <tr>
              <td align="center">
                <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
                <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${reporterEmail}">${reporterEmail}</a>:</h1>
                <p style="color: #666666;">Hemos recibido tu reporte en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a>, agradecemos tu ayuda. 
                  <br/>
                  Tus reportes son valiosos para mantener una comunidad sana y respetuosa para todos. 
                </p>
                <br/>   
                 <p style="color: #666666;">
                  A continuación, encontrarás un resumen del reporte que realizaste:
                </p>
                <table style="color: #666666; margin-bottom: 10px">
                  <tr>
                    <td style="padding:5px; font-weight: bold">Reportaste a (${type}): </td>
                    <td>${reported}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px; font-weight: bold">Hora de reporte: </td>
                    <td>${reportDate}</td>
                  </tr>
                </table>
                <p style="color: #666666;margin-bottom: 30px">
                  Nos comunicaremos nuevamente en cuanto tengamos noticias de tu reporte.
                </p>
                <p style="color: ##666666; opacity: 0.7; width: 90%;">
                  Si deseas mas información puedes contactarte con nuestro equipo a <a href="mailto:help@overcome.tech">help@overcome.tech</a>
                </p>
              </td>
            </tr>
          </table>
      `,
        })

        await resend.emails.send({
            from: 'Overcome <sender@app-overcome.schr.tech>',
            to: [reportedEmail],
            subject: 'Tienes un nuevo reporte ⚠️',
            html: `
            <table width="100%"  cellpadding="0" cellspacing="0"  style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
            <tr>
              <td align="center">
                <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
                <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${reportedEmail}">${reportedEmail}</a>:</h1>
                <p style="color: #666666;">Hemos recibido un reporte en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a> sobre algo relacionado a ti.
                  Los reportes son valiosos para mantener una comunidad sana y respetuosa para todos. 
                </p>
                <br/>   
                 <p style="color: #666666;">
                  A continuación, encontrarás un resumen del reporte mencionado:
                </p>
                <table style="color: #666666; margin-bottom: 10px">
                  <tr>
                    <td style="padding:5px; font-weight: bold">Fué reportado (${type}): </td>
                    <td>${reported}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px; font-weight: bold">Hora de reporte: </td>
                    <td>${reportDate}</td>
                  </tr>
                </table>
                <p style="color: #666666;margin-bottom: 30px">
                  Nos comunicaremos nuevamente en cuanto tengamos noticias del reporte.
                </p>
                <p style="color: ##666666; opacity: 0.7; width: 90%;">
                  Si deseas mas información puedes contactarte con nuestro equipo a <a href="mailto:help@overcome.tech">help@overcome.tech</a>
                </p>
              </td>
            </tr>
          </table>
      `,
        })

        res.status(200).json({
            status: 'success',
            data,
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            status: 'fail',
            message: err.message,
        })
    }
}

// Get all reports
const getAllReports = async (req, res) => {
    try {
        const filter = {}

        if (req.query.type) filter.type = req.query.type

        const reports = await Report.find(filter)
            .populate('reporter', 'username')
            .populate('revisor', 'username')
            .populate('eventId', 'title')
            .populate('perpetrator', 'username')

        res.status(200).json({
            status: 'success',
            results: reports.length,
            data: {
                reports,
            },
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message,
        })
    }
}

// Delete report
const deleteEventReports = async (eventId) => {
    try {
        const resend = await new Resend(process.env.RESEND_API_KEY)
        // Get a list all the perpetrators (owner User) & All the reporters (User)
        // Get from any report that contains eventId: eventId

        const reportsWithEventId = await Report.find({ eventId: eventId })

        const event = await Event.findById(eventId).populate('creator', 'email')

        const emailOwner = event.creator.email

        await resend.emails.send({
            from: 'Overcome <sender@app-overcome.schr.tech>',
            to: [emailOwner],
            subject: 'Resolución de Reporte 📄',
            html: `
            <table width="100%"  cellpadding="0" cellspacing="0"  style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
            <tr>
              <td align="center">
                <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
                <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${emailOwner}">${emailOwner}</a>:</h1>
                <p style="color: #666666;">Hace tiempo recibimos un reporte en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a> sobre un evento que creaste. 
                  <br/>
                  Los reportes son valiosos para mantener una comunidad sana y respetuosa para todos. 
                </p>
                <br/>   
                <p style="color: #666666;">
                  Luego de revisar el reporte, hemos decidido eliminar el evento:
                </p>
                <table style="color: #666666; margin-bottom: 10px">
                  <tr>
                    <td style="padding:5px; font-weight: bold">Evento eliminado: </td>
                    <td>${event.title}</td>
                  </tr>
                </table>
                <p style="color: #666666;margin-bottom: 30px">
                  Esperamos que sigas creando eventos en Overcome, pero recuerda que debes respetar las <a href='https://app-overcome.onrender.com/terms' target="_blank">Condiciones de Uso</a> de la plataforma.
                </p>
                <p style="color: ##666666; opacity: 0.7; width: 90%;">
                  Si deseas mas información puedes contactarte con nuestro equipo a <a href="mailto:help@overcome.tech">help@overcome.tech</a>
                </p>
              </td>
            </tr>
          </table>
        `,
        })

        var reporters = await Report.find({ eventId: eventId }).select(
            'reporter'
        )
        // Get for each reporter get reporter.reporter, filter duplicates
        reporters = reporters.filter(
            (v, i, a) => a.findIndex((t) => t.reporter === v.reporter) === i
        )

        // For each reporter, send an email
        await reporters.forEach(async (reporter) => {
            var reporterEmail = await User.findById(reporter.reporter).select(
                'email'
            )
            reporterEmail = reporterEmail.email

            await resend.emails.send({
                from: 'Overcome <sender@app-overcome.schr.tech>',
                to: [reporterEmail],
                subject: 'Resolución de Reporte 📄',
                html: `
                <table width="100%"  cellpadding="0" cellspacing="0"  style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
                <tr>
                  <td align="center">
                    <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
                    <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${reporterEmail}">${reporterEmail}</a>:</h1>
                    <p style="color: #666666;">Hace tiempo recibimos un reporte tuyo en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a> hacia un evento que consideraste inapropiado. 
                      <br/>
                      Los reportes son valiosos para mantener una comunidad sana y respetuosa para todos. 
                    </p>
                    <br/>   
                    <p style="color: #666666;">
                      Luego de revisar el reporte, hemos decidido eliminar el evento:
                    </p>
                    <table style="color: #666666; margin-bottom: 10px">
                      <tr>
                        <td style="padding:5px; font-weight: bold">Evento eliminado: </td>
                        <td>${event.title}</td>
                      </tr>
                    </table>
                    <p style="color: #666666;margin-bottom: 30px">
                      Gracias por ayudarnos a mantener una comunidad sana y respetuosa para todos.
                    </p>
                    <p style="color: ##666666; opacity: 0.7; width: 90%;">
                      Si deseas mas información puedes contactarte con nuestro equipo a <a href="mailto:help@overcome.tech">help@overcome.tech</a>
                    </p>
                  </td>
                </tr>
              </table>
            `,
            })
        })

        // !TODO Setting status as Closed will be needed in the future
        await Report.deleteMany({ eventId: eventId })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            status: 'fail',
            message: error.message,
        })
    }
}

// Close report
const closeEventReportById = async (req, res) => {
    try {
        const resend = await new Resend(process.env.RESEND_API_KEY)

        const reportId = req.params.id
        const report = await Report.findById(reportId).populate(
            'reporter',
            'email'
        )

        if (!report) {
            return res.status(404).json({ message: 'Report not found' })
        }

        const reporterEmail = report.reporter.email

        // Get report.eventId
        const eventId = report.eventId
        const event = await Event.findById(eventId).populate('creator', 'email')

        const emailOwner = event.creator.email

        await resend.emails.send({
            from: 'Overcome <sender@app-overcome.schr.tech>',
            to: [reporterEmail],
            subject: 'Resolución de Reporte 📄',
            html: `
          <table width="100%"  cellpadding="0" cellspacing="0"  style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
          <tr>
            <td align="center">
              <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
              <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${reporterEmail}">${reporterEmail}</a>:</h1>
              <p style="color: #666666;">Hace tiempo recibimos un reporte tuyo en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a> hacia un evento que consideraste inapropiado. 
                <br/>
                Los reportes son valiosos para mantener una comunidad sana y respetuosa para todos. 
              </p>
              <br/>   
              <p style="color: #666666;">
                Luego de revisar el reporte, hemos decidido no eliminar el evento:
              </p>
              <table style="color: #666666; margin-bottom: 10px">
                <tr>
                  <td style="padding:5px; font-weight: bold">Evento eliminado: </td>
                  <td>${event.title}</td>
                </tr>
              </table>
              <p style="color: #666666;margin-bottom: 30px">
                Gracias por ayudarnos a mantener una comunidad sana y respetuosa para todos.
              </p>
              <p style="color: ##666666; opacity: 0.7; width: 90%;">
                Si deseas mas información puedes contactarte con nuestro equipo a <a href="mailto:help@overcome.tech">help@overcome.tech</a>
              </p>
            </td>
          </tr>
        </table>
      `,
        })

        await resend.emails.send({
            from: 'Overcome <sender@app-overcome.schr.tech>',
            to: [emailOwner],
            subject: 'Resolución de Reporte 📄',
            html: `
            <table width="100%"  cellpadding="0" cellspacing="0"  style="background-color: #ffffff; border-radius: 4px; padding: 20px;margin-top: 1rem">
            <tr>
              <td align="center">
                <img src='https://drive.google.com/uc?id=1t2AKc12EanKhfjs_dIqXgXFk-ySY9l4x' style="height:100px"/>
                <h1 style="color: #333333; font-size:29px">Hola, <a href="mailto:${emailOwner}">${emailOwner}</a>:</h1>
                <p style="color: #666666;">Hace tiempo recibimos un reporte en <a href='https://app-overcome.onrender.com' target="_blank">Overcome</a> sobre un evento que creaste. 
                  <br/>
                  Los reportes son valiosos para mantener una comunidad sana y respetuosa para todos. 
                </p>
                <br/>   
                <p style="color: #666666;">
                  Luego de revisar el reporte, hemos decidido no eliminar el evento:
                </p>
                <table style="color: #666666; margin-bottom: 10px">
                  <tr>
                    <td style="padding:5px; font-weight: bold">Evento eliminado: </td>
                    <td>${event.title}</td>
                  </tr>
                </table>
                <p style="color: #666666;margin-bottom: 30px">
                  Esperamos que sigas creando eventos en Overcome, pero recuerda que debes respetar las <a href='https://app-overcome.onrender.com/terms' target="_blank">Condiciones de Uso</a> de la plataforma.
                </p>
                <p style="color: ##666666; opacity: 0.7; width: 90%;">
                  Si deseas mas información puedes contactarte con nuestro equipo a <a href="mailto:help@overcome.tech">help@overcome.tech</a>
                </p>
              </td>
            </tr>
          </table>
        `,
        })

        // !TODO Setting status as Closed will be needed in the future
        await Report.deleteOne({ _id: reportId })

        res.status(200).json(report)
    } catch (error) {
        console.error(error)
        res.status(500).send('Error closing report')
    }
}

module.exports = {
    createReport,
    getAllReports,
    deleteEventReports,
    closeEventReportById,
}
