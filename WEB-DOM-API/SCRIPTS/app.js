const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

// Referencias al DOM principales
const postsContainer = document.getElementById('posts-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');

// Referencias al DOM del Modal y Formulario
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const postModal = document.getElementById('post-modal');
const newPostForm = document.getElementById('new-post-form');
const newTitleInput = document.getElementById('new-title');
const newBodyInput = document.getElementById('new-body');

//Referencias y variable de usuarios (debajo de las otras referencias al DOM)
const userModal = document.getElementById('user-modal');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const userDetails = document.getElementById('user-details');

let allUsers = [];
let allPosts = [];

/**
 * Inicializar aplicación cargando datos GET
 */
async function initApp() {
  showLoading(true);
  showError(false); // Corregido: Oculta el error al iniciar correctamente

  try {
    // Realizamos peticiones en paralelo usando Promise.all
    const [postsResponse, usersResponse] = await Promise.all([
      fetch(POSTS_URL),
      fetch(USERS_URL),
    ]);

    if (!postsResponse.ok || !usersResponse.ok) {
      throw new Error('Error al conectar con el servidor.');
    }

    const posts = await postsResponse.json();
    const users = await usersResponse.json();
    allUsers = users;
    // Mapeamos los posts para adjuntar el nombre del autor

    allPosts = posts.map((post) => {
      const author = users.find((user) => user.id === post.userId);
      return {
        ...post,
        authorName: author ? author.name : 'Usuario Desconocido',
      };
    });

    // Renderizamos las tarjetas en el DOM
    renderPosts(allPosts);
  } catch (error) {
    console.error('Hubo un problema:', error);
    showError(true);
  } finally {
    showLoading(false);
  }
}

/**
 * Renderizar tarjetas en el DOM
 */
function renderPosts(postsToRender) {
  if (postsToRender.length === 0) {
    postsContainer.innerHTML = `<p class="no-results" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron publicaciones.</p>`;
    return;
  }

  const postsHTML = postsToRender
    .map(
      (post) => `
        <article class="post-card" data-post-id="${post.id}" tabindex="0" role="button" title="Ver información del autor">
            <div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-body">${post.body}</p>
            </div>
            <span class="post-author">✍️ ${post.authorName}</span>
        </article>
    `,
    )
    .join('');

  postsContainer.innerHTML = postsHTML;
}

/**
 * Manejo del Modal (Abrir y Cerrar)
 */
openModalBtn.addEventListener('click', () => {
  postModal.classList.remove('hidden');
  newTitleInput.focus();
});

closeModalBtn.addEventListener('click', () => {
  postModal.classList.add('hidden');
});

// Cerrar si se hace clic fuera del contenido del modal
window.addEventListener('click', (e) => {
  if (e.target === postModal) {
    postModal.classList.add('hidden');
  }
});

function showUserDetails(post) {
  const user = allUsers.find((u) => u.id === post.userId);

  if (!user) {
    userDetails.innerHTML = `
            <h2>Información del usuario</h2>
            <p class="user-empty">No hay información disponible para este autor.</p>
        `;
  } else {
    const { address, company } = user;
    userDetails.innerHTML = `
            <h2>👤 ${user.name}</h2>
            <p class="user-username">@${user.username}</p>
            <dl class="user-info">
                <dt>📧 Correo</dt>
                <dd><a href="mailto:${user.email}">${user.email}</a></dd>
                <dt>📞 Teléfono</dt>
                <dd>${user.phone}</dd>
                <dt>🌐 Sitio web</dt>
                <dd><a href="https://${user.website}" target="_blank" rel="noopener noreferrer">${user.website}</a></dd>
                <dt>📍 Dirección</dt>
                <dd>${address.street}, ${address.suite}<br>${address.city}, ${address.zipcode}</dd>
                <dt>🏢 Empresa</dt>
                <dd><strong>${company.name}</strong><br><em>${company.catchPhrase}</em></dd>
            </dl>
        `;
  }

  userModal.classList.remove('hidden');
}

function closeUserModal() {
  userModal.classList.add('hidden');
}

function handleCardSelect(e) {
  const card = e.target.closest('.post-card');
  if (!card) return;

  const post = allPosts.find((p) => String(p.id) === card.dataset.postId);
  if (post) showUserDetails(post);
}

postsContainer.addEventListener('click', handleCardSelect);

postsContainer.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCardSelect(e);
  }
});

closeUserModalBtn.addEventListener('click', closeUserModal);

window.addEventListener('click', (e) => {
  if (e.target === userModal) closeUserModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeUserModal();
});
/**
 * Enviar Nueva Publicación mediante Petición POST
 */
newPostForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = newTitleInput.value.trim();
  const body = newBodyInput.value.trim();

  if (!title || !body) return;

  const newPostPayload = {
    title: title,
    body: body,
    userId: 1, // Simulamos que el usuario actual tiene ID 1
  };

  try {
    const response = await fetch(POSTS_URL, {
      method: 'POST',
      body: JSON.stringify(newPostPayload),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });

    if (!response.ok) {
      throw new Error('Error al registrar la publicación en el servidor.');
    }

    const createdPost = await response.json();
    createdPost.id = Date.now();
    createdPost.authorName = 'Tú (Autor Actual)';

    // Insertamos el nuevo post al inicio del arreglo global
    allPosts.unshift(createdPost);

    // Volvemos a renderizar la interfaz
    renderPosts(allPosts);

    // Limpiamos formulario y cerramos modal
    newPostForm.reset();
    postModal.classList.add('hidden');

    alert('¡Publicación creada exitosamente!');
  } catch (error) {
    console.error('Error al enviar POST:', error);
    alert('No se pudo crear la publicación. Inténtalo de nuevo.');
  }
});

/**
 * Buscador en tiempo real
 */
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();

  const filteredPosts = allPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.body.toLowerCase().includes(searchTerm),
  );

  renderPosts(filteredPosts);
});

// Funciones auxiliares de UI (Control de estados)
function showLoading(isLoading) {
  if (isLoading) {
    loadingSpinner.classList.remove('hidden');
  } else {
    loadingSpinner.classList.add('hidden');
  }
}

function showError(hasError) {
  if (hasError) {
    errorMessage.classList.remove('hidden');
  } else {
    errorMessage.classList.add('hidden');
  }
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp);
