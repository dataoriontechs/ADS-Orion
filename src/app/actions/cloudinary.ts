
'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz o upload de um arquivo para o Cloudinary.
 * @param base64Data O arquivo em formato base64.
 * @param folder A pasta de destino dentro do Cloudinary (ex: 'profiles', 'campaigns').
 * @returns A URL segura e o public_id do arquivo.
 */
export async function uploadToCloudinary(base64Data: string, folder: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `ads_orion/${folder}`,
      resource_type: 'auto', // Detecta automaticamente se é imagem, vídeo ou áudio
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Falha ao realizar o upload do arquivo para o servidor de mídia.');
  }
}
