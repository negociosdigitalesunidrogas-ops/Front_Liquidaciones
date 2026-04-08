const API_URL = "https://vague-monika-preimportantly.ngrok-free.dev";

if (localStorage.getItem('access_token')) {
    window.location.href = 'dashboard.html';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const codigo = document.getElementById('codigo').value;
    const documento = document.getElementById('documento').value;
    const mensajeDiv = document.getElementById('mensaje');
    const btn = document.getElementById('btnLogin');

    btn.innerText = "Validando...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo, documento: documento })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('nombre_usuario', data.nombre);
            localStorage.setItem('cargo_usuario', data.cargo);
            
            window.location.href = 'dashboard.html';
        } else {
            // Mostramos el error del backend
            mensajeDiv.innerText = data.detail || "Credenciales incorrectas";
            mensajeDiv.style.display = "block";
        }
    } catch (error) {
        mensajeDiv.innerText = "Error de conexión con el servidor";
        mensajeDiv.style.display = "block";
    } finally {
        btn.innerText = "Ingresar al Portal";
        btn.disabled = false;
    }
});
