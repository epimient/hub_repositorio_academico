const state = { projects: [], categories: [], category: 'todos', query: '' };
const grid = document.getElementById('projectsGrid');
const filters = document.getElementById('filterButtons');
const search = document.getElementById('searchInput');

function projectCard(project) {
  const category = state.categories.find(item => item.id === project.category);
  const detailUrl = `app.html?repo=${encodeURIComponent(new URL(project.githubUrl).pathname.slice(1))}`;
  const cardLink = document.createElement('a');
  cardLink.href = detailUrl;
  cardLink.className = 'project-card-link';
  cardLink.setAttribute('aria-label', `Ver detalles y README de ${project.name}, de ${project.student}`);
  const article = document.createElement('article');
  article.className = 'project-card';
  const top = document.createElement('div');
  top.className = 'card-top';
  const badge = document.createElement('span');
  badge.className = 'category-badge';
  badge.textContent = category?.name || 'Otros proyectos';
  const icon = document.createElement('span');
  icon.className = 'card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '↗';
  top.append(badge, icon);
  const name = document.createElement('h3');
  name.textContent = project.name;
  const student = document.createElement('p');
  student.className = 'student';
  student.textContent = project.student;
  const link = document.createElement('span');
  link.className = 'repo-link';
  link.textContent = 'Ver proyecto y README';
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = ' ↗';
  link.append(arrow);
  article.append(top, name, student, link);
  cardLink.append(article);
  return cardLink;
}

function render() {
  const query = state.query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = state.projects.filter(project => {
    const matchesCategory = state.category === 'todos' || project.category === state.category;
    const text = `${project.name} ${project.student}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return matchesCategory && text.includes(query);
  });
  grid.replaceChildren();
  if (visible.length) {
    grid.append(...visible.map(projectCard));
  } else {
    const message = document.createElement('p');
    message.className = 'status-message';
    message.textContent = 'No hay proyectos para esta búsqueda. Prueba otro término o categoría.';
    grid.append(message);
  }
  document.getElementById('resultCount').textContent = `${visible.length} de ${state.projects.length} repositorios`;
}

function renderFilters() {
  filters.replaceChildren();
  for (const category of [{ id: 'todos', name: 'Todos' }, ...state.categories]) {
    const count = category.id === 'todos' ? state.projects.length : state.projects.filter(project => project.category === category.id).length;
    if (!count) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-button';
    button.textContent = `${category.name} (${count})`;
    button.setAttribute('aria-pressed', String(state.category === category.id));
    button.addEventListener('click', () => {
      state.category = category.id;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      render();
    });
    filters.append(button);
  }
}

search.addEventListener('input', () => {
  state.query = search.value.trim();
  render();
});

fetch('data/projects.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    state.projects = data.projects;
    state.categories = data.categories;
    document.getElementById('heroCount').textContent = state.projects.length;
    renderFilters();
    render();
  })
  .catch(error => {
    console.error('No se pudo cargar el catálogo:', error);
    grid.textContent = 'No se pudo cargar el catálogo. Abre la página desde un servidor local e inténtalo de nuevo.';
    grid.classList.add('status-message');
  });
