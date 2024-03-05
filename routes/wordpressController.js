export const subirImagenesAWordPress = async (imagenes, WP_API_URL, WP_AUTH) => {
    const urlsDeImagenes = []; // Para almacenar las URLs de las imágenes subidas

    for (const imagen of imagenes) {
        const formData = new FormData();
        formData.append('file', imagen);

        try {
            const response = await fetch(`${WP_API_URL}/wp-json/wp/v2/media`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(WP_AUTH).toString('base64')}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`No se pudo subir la imagen a WordPress. Estado: ${response.statusText}`);
            }
            const data = await response.json();
            urlsDeImagenes.push({ src: data.source_url });
        } catch (error) {
            console.error('Error al subir imagen a WordPress:', error);
            throw error; // O maneja el error según necesites
        }
    }

    return urlsDeImagenes; // Retorna un array de objetos con las URLs de las imágenes subidas
};