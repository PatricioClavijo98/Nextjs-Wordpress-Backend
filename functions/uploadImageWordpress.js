export async function subirImagenAWordPress(imagen, usuario) {
    const url = `${usuario.url}/wp-json/wp/v2/media`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(usuario.authorization)}`,
            'Content-Disposition': 'attachment; filename="' + imagen.originalname + '"',
            'Content-Type': imagen.mimetype,
        },
        body: imagen.buffer,
    });

    if (!response.ok) {
        throw new Error(`Error al subir imagen: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Debería contener la URL de la imagen y otros datos relevantes
}
