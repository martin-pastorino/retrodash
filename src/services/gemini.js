// ==========================================================================
// RetroDash: World-Class Gemini AI Service (Agile Facilitator)
// ==========================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  /**
   * Analiza las tarjetas con votos de una retrospectiva utilizando Gemini 2.5 Flash.
   * Genera un resumen del estado de ánimo del equipo (mood) y hasta 3 accionables concretos en formato JSON.
   * 
   * @param {Array} cards - Tarjetas del tablero
   * @param {Array} columns - Configuración de columnas
   * @param {string} localApiKey - API Key local de Gemini (localStorage)
   * @returns {Promise<{moodSummary: string, moodEmoji: string, actionItems: Array}>}
   */
  async generateRetroActionables(cards, columns, localApiKey) {
    // 1. Cadena de resolución de API Key (Configuración local > Variable de entorno)
    const apiKey = localApiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API Key de Gemini no encontrada. Por favor, configúrala en tu archivo .env.local o en la sección de Ajustes.');
    }

    // 2. Filtrado y ordenamiento de tarjetas relevantes (al menos 1 voto)
    const relevantCards = cards
      .filter(c => c.votes && c.votes.length >= 1)
      .map(c => {
        const colName = columns.find(col => col.id === c.columnId)?.name || 'Columna';
        return {
          columna: colName,
          comentario: c.text,
          votos: c.votes.length
        };
      })
      .sort((a, b) => b.votos - a.votos);

    if (relevantCards.length === 0) {
      throw new Error('No hay tarjetas con al menos 1 voto en el tablero para realizar el análisis de IA. Asegúrate de votar al menos una tarjeta antes de generar.');
    }

    // 3. Inicialización del SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 4. Prompt de Comportamiento e Instrucciones estructuradas
    const COMPORTAMIENTO_IA = `
      Actúas como un facilitador experto de retrospectivas Agile y Scrum. 
      Analiza los siguientes comentarios generados por el equipo, agrupados por columna y con su número de votos correspondiente. Quiero que seas sumamente analítico y sincero, danos tu opinión como si fueras un agile coach con muchos años de experiencia.
      
      Genera una lista de un máximo de 3 ítems de acción concretos, realistas, directos y listos para ejecutar en el siguiente Sprint.
      Redacta las explicaciones y accionables completamente en español de manera profesional y motivadora. Además quiero que me des un resumen del estado de ánimo del equipo, con un emoji que lo represente.
    `;

    const prompt = `
      ${COMPORTAMIENTO_IA}

      Comentarios de la retrospectiva a analizar:
      ${JSON.stringify(relevantCards, null, 2)}

      Escribe el resultado final del análisis EXCLUSIVAMENTE en formato JSON con la siguiente estructura exacta, sin introducciones, conclusiones ni bloques Markdown (NO uses \`\`\`json ni nada de texto adicional):
      {
        "moodSummary": "Resumen analítico y sincero del estado de ánimo del equipo en este Sprint (basado en sus comentarios y votos)...",
        "moodEmoji": "Un solo emoji que represente mejor el sentimiento del Sprint (ej. 🚀, 😅, 🧘, 😤, 😭, 😊)",
        "actionItems": [
          {
            "text": "Accionable concreto redactado en formato imperativo",
            "reason": "Explicación breve de por qué se toma este accionable basándose en los comentarios con más votos."
          }
        ]
      }
    `;

    // 5. Consumo asíncrono seguro del LLM
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // 6. Sanitización del JSON de salida
    let cleanJsonStr = responseText;
    if (cleanJsonStr.includes('```json')) {
      cleanJsonStr = cleanJsonStr.split('```json')[1].split('```')[0].trim();
    } else if (cleanJsonStr.includes('```')) {
      cleanJsonStr = cleanJsonStr.split('```')[1].split('```')[0].trim();
    }

    // 7. Parseo robusto y manejo de fallas de estructuración de salida
    try {
      const parsedResult = JSON.parse(cleanJsonStr);
      return {
        moodSummary: parsedResult.moodSummary || 'Análisis completado.',
        moodEmoji: parsedResult.moodEmoji || '✨',
        actionItems: parsedResult.actionItems || []
      };
    } catch (parseError) {
      console.error('Error al deserializar la respuesta JSON de Gemini:', cleanJsonStr, parseError);
      throw new Error('La respuesta de la IA no pudo ser parseada a JSON. Por favor, reintenta el análisis.');
    }
  }
}

export const geminiService = new GeminiService();
