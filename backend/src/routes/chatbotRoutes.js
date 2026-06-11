import express from 'express';

const router = express.Router();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const model = process.env.GOOGLE_CLOUD_MODEL || 'chat-bison';
const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

function parseGoogleCloudResponse(data) {
  const prediction = data?.predictions?.[0];
  if (!prediction) return null;

  if (typeof prediction.content === 'string') return prediction.content;
  if (Array.isArray(prediction.messages) && prediction.messages[0]?.content) {
    return prediction.messages[0].content;
  }
  if (Array.isArray(prediction.candidates) && prediction.candidates[0]?.content) {
    return prediction.candidates[0].content;
  }
  if (typeof prediction.text === 'string') return prediction.text;

  return null;
}

router.post('/', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    if (!apiKey || !projectId) {
      return res.status(500).json({
        error: 'Chatbot não configurado. Defina GOOGLE_CLOUD_API_KEY e GOOGLE_CLOUD_PROJECT_ID no arquivo .env.'
      });
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/models/${model}:generateMessage?key=${apiKey}`;
    const payload = {
      instances: [
        {
          messages: [
            {
              author: 'user',
              content: message
            }
          ]
        }
      ],
      parameters: {
        temperature: 0.2,
        maxOutputTokens: 250
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Erro ao chamar o Google Cloud AI.'
      });
    }

    const answer = parseGoogleCloudResponse(data);
    if (!answer) {
      return res.status(500).json({ error: 'Resposta inválida do chatbot.' });
    }

    res.json({ message: answer, raw: data });
  } catch (error) {
    console.error('Erro no chatbot:', error);
    res.status(500).json({ error: 'Erro interno do chatbot.' });
  }
});

export default router;
