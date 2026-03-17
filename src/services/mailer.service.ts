import { Resend } from "resend";

// Opción recomendada: inicializarlo así para evitar el error de "Missing API key" en el arranque
export const enviarMailBienvenida = async (
  emailDestino: string,
  nombre: string,
  passwordProvisoria: string,
) => {
  // Si por alguna razón la variable no carga en el scope global, la llamamos acá
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "Sistema Scout <onboarding@resend.dev>",
      to: emailDestino,
      subject: "¡Bienvenido al Sistema Scout!",
      html: `<strong>Hola ${nombre}</strong>, tu contraseña provisoria es: ${passwordProvisoria}`,
    });

    if (error) {
      return console.error("Error de Resend:", error);
    }

    console.log("Email enviado con ID:", data?.id);
  } catch (err) {
    console.error("Error inesperado:", err);
  }
};
