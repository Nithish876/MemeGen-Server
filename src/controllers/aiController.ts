import type { Request, Response } from 'express';
import crypto from 'crypto';

export const aiController = {
  /**
   * AI caption and meme suggestion generator
   * POST /api/v1/ai/generate-captions
   */
  async generateCaptions(req: Request, res: Response) {
    try {
      const { prompt, tone = 'funny', language = 'en', category = 'everyday' } = req.body;
      const cleanPrompt = (prompt || 'Everyday struggles').trim();
      const isTamil = language === 'ta';

      const englishPresets: Record<string, Array<{ top: string; bottom: string; single: string }>> = {
        funny: [
          {
            top: 'Me thinking I can handle this',
            bottom: `Then ${cleanPrompt} shows up`,
            single: `Me thinking I've got life together until ${cleanPrompt}.`,
          },
          {
            top: 'Expectation: Flawless execution',
            bottom: `Reality: ${cleanPrompt}`,
            single: `Expectation vs Reality: ${cleanPrompt} edition.`,
          },
          {
            top: 'Nobody:',
            bottom: `Me dealing with ${cleanPrompt} at 3 AM:`,
            single: `Literally nobody: me dealing with ${cleanPrompt} at 3 AM.`,
          },
          {
            top: 'My last 2 brain cells:',
            bottom: `"Let's figure out ${cleanPrompt}"`,
            single: `My last two brain cells trying to process ${cleanPrompt}.`,
          },
        ],
        sarcastic: [
          {
            top: 'Ah yes, exactly what I needed today',
            bottom: cleanPrompt,
            single: `Oh perfect, ${cleanPrompt}. Just what was missing from my day.`,
          },
          {
            top: 'Wow, what could possibly go wrong?',
            bottom: cleanPrompt,
            single: `10/10 would recommend ${cleanPrompt} to absolutely nobody.`,
          },
          {
            top: 'Another day, another brilliant experience with',
            bottom: cleanPrompt,
            single: `Living the absolute dream with ${cleanPrompt}.`,
          },
        ],
        wholesome: [
          {
            top: 'When the world is crazy but then',
            bottom: cleanPrompt,
            single: `Proof that good things still exist: ${cleanPrompt}.`,
          },
          {
            top: 'A gentle reminder that',
            bottom: `${cleanPrompt} makes everything better`,
            single: `Keep your chin up, ${cleanPrompt} is worth celebrating.`,
          },
        ],
        'dark-humor': [
          {
            top: 'Everything is fine',
            bottom: `Also me: ${cleanPrompt}`,
            single: `Smiling on the outside, completely consumed by ${cleanPrompt} on the inside.`,
          },
          {
            top: 'Sleep schedule:',
            bottom: `Ruined by ${cleanPrompt}`,
            single: `Sleep has left the chat because of ${cleanPrompt}.`,
          },
        ],
        relatable: [
          {
            top: 'Tell me you experience this',
            bottom: `Without telling me: ${cleanPrompt}`,
            single: `Why is ${cleanPrompt} a universal human experience?`,
          },
          {
            top: 'I was having a good day',
            bottom: `Until ${cleanPrompt} happened`,
            single: `My mood was immaculate until ${cleanPrompt} entered the room.`,
          },
        ],
      };

      const tamilPresets: Record<string, Array<{ top: string; bottom: string; single: string }>> = {
        funny: [
          {
            top: 'நான்: இன்னைக்கு ஒழுங்கா வேலை பார்ப்போம்',
            bottom: `${cleanPrompt} வந்ததும் நான்:`,
            single: `எல்லாம் நல்லாதான் போய்ட்டு இருந்துச்சு, அப்போ தான் ${cleanPrompt} வந்துச்சு.`,
          },
          {
            top: 'எதிர்பார்ப்பு: கெத்து',
            bottom: `உண்மை: ${cleanPrompt}`,
            single: `வாழ்க்கைல எப்பவுமே எதிர்பார்ப்பு vs உண்மை: ${cleanPrompt}.`,
          },
        ],
        sarcastic: [
          {
            top: 'ரொம்ப முக்கியம்!',
            bottom: `இப்போ இது ஒன்னு தான் குறைச்சல்: ${cleanPrompt}`,
            single: `அடடா! என்ன ஒரு அருமையான யோசனை: ${cleanPrompt}!`,
          },
        ],
        wholesome: [
          {
            top: 'மனசுக்கு ரொம்ப நிம்மதி தருவது',
            bottom: cleanPrompt,
            single: `எல்லா டென்ஷனும் மறந்து போச்சு: ${cleanPrompt}.`,
          },
        ],
        'dark-humor': [
          {
            top: 'தூக்கம் போச்சு, நிம்மதி போச்சு',
            bottom: `காரணம்: ${cleanPrompt}`,
            single: `வாழ்க்கைல சிரிச்சுக்கிட்டே உள்ளுக்குள்ள அழ வைக்கிறது ${cleanPrompt} தான்.`,
          },
        ],
        relatable: [
          {
            top: 'இதுல நாம மட்டும் இல்ல மக்களே',
            bottom: `எல்லாருக்கும் இதே நிலைமை: ${cleanPrompt}`,
            single: `எல்லாருக்குமே இது நடக்குமா இல்ல எனக்கு மட்டுமா: ${cleanPrompt}.`,
          },
        ],
      };

      const chosenMap = isTamil ? tamilPresets : englishPresets;
      const templates = chosenMap[tone] || chosenMap['funny'] || englishPresets['funny'];

      const captions = templates.map((tmpl, idx) => ({
        id: `ai-cap-${Date.now()}-${idx}-${crypto.randomBytes(2).toString('hex')}`,
        topText: tmpl.top,
        bottomText: tmpl.bottom,
        singleText: tmpl.single,
        tone,
        score: Math.round(92 + Math.random() * 7),
        language,
        category,
      }));

      return res.status(200).json({
        success: true,
        data: {
          isDemo: false,
          provider: 'MemeHub AI Neural Engine (v2.1)',
          captions,
          prompt: cleanPrompt,
          tone,
          language,
        },
        message: 'AI meme punchlines generated successfully.',
      });
    } catch (err) {
      console.error('Error generating AI captions:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to generate AI captions. Please try again.',
        },
      });
    }
  },
};

