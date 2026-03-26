/**
 * backend/controllers/aiController.js
 * Controlador para el Asistente de IA (Agendly AI)
 */

const OpenAI = require('openai');
const Company = require('../models/Company');
const Appointment = require('../models/Appointment');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.askAI = async (req, res) => {
  const { message, context } = req.body;

  try {
    // 1. Recopilar contexto relevante del sistema
    let systemContext = "Eres Agendly AI, un asistente inteligente para una plataforma SaaS de agendación de citas. ";
    systemContext += "Tu objetivo es ayudar a los usuarios (clientes y administradores) a navegar la plataforma y responder dudas sobre citas y disponibilidad. ";
    systemContext += "Mantén un tono profesional, elegante, minimalista y servicial, coherente con la estética de la marca. ";

    if (req.user.role === 'admin') {
      const company = await Company.findOne({ owner: req.user._id });
      const appointments = await Appointment.find({ company: company?._id }).limit(5);
      systemContext += `\nContexto del Administrador:
        - Nombre: ${req.user.name}
        - Empresa: ${company ? company.name : 'No configurada'}
        - Últimas citas: ${appointments.length > 0 ? appointments.map(a => `${a.startTime.toLocaleDateString()} - ${a.service}`).join(', ') : 'Sin citas recientes'}.`;
    } else {
      const appointments = await Appointment.find({ client: req.user._id }).limit(5);
      systemContext += `\nContexto del Cliente:
        - Nombre: ${req.user.name}
        - Tus próximas citas: ${appointments.length > 0 ? appointments.map(a => `${a.startTime.toLocaleDateString()} en ${a.company}`).join(', ') : 'No tienes citas agendadas'}.`;
    }

    // 2. Llamada a OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: message }
      ],
      max_tokens: 300,
    });

    const aiResponse = response.choices[0].message.content;

    res.json({ reply: aiResponse });
  } catch (error) {
    console.error('Error con OpenAI:', error.message);
    
    // Fallback si no hay API KEY o hay error
    let fallback = "Lo siento, mi motor de inteligencia artificial está en mantenimiento. ";
    if (message.toLowerCase().includes('hola')) fallback = "¡Hola! Soy Agendly AI. ¿En qué puedo ayudarte con tus citas hoy?";
    if (message.toLowerCase().includes('cita')) fallback = "Para agendar una cita, ve a la sección 'Nueva Cita' en tu panel izquierdo.";
    
    res.json({ reply: fallback });
  }
};
