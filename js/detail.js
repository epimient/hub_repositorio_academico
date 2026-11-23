const statusElement = document.getElementById('detailStatus');
const contentElement = document.getElementById('detailContent');
const readmeElement = document.getElementById('readmeContent');

function setReadmeMessage(message, url) {
  readmeElement.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.className = 'readme-empty';
  paragraph.textContent = message;
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Ver el repositorio en GitHub ↗';
    paragraph.append(document.createTextNode(' '), link);
  }
  readmeElement.append(paragraph);
}

function repositoryParts(url) {
  const parsed = new URL(url);
  if (parsed.hostname !== 'github.com') throw new Error('URL de repositorio no válida');
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length !== 2) throw new Error('URL de repositorio no válida');
  return parts;
}

function setProject(project, categories, allProjects = []) {
  const category = categories.find(item => item.id === project.category);
  document.getElementById('detailCategory').textContent = `${category?.name || 'Otros proyectos'} / POO 2026-2`;
  document.getElementById('detailName').textContent = project.name;

  const coAuthors = allProjects
    .filter(item => {
      try {
        return new URL(item.githubUrl).pathname.slice(1).toLowerCase() === new URL(project.githubUrl).pathname.slice(1).toLowerCase();
      } catch {
        return false;
      }
    })
    .map(item => item.student);

  if (coAuthors.length > 1) {
    document.getElementById('detailStudent').textContent = `Proyecto de ${coAuthors.join(' y ')}`;
  } else {
    document.getElementById('detailStudent').textContent = `Proyecto de ${project.student}`;
  }

  document.getElementById('detailDescription').textContent = 'Consulta el README para conocer la explicación del proyecto.';
  document.getElementById('githubButton').href = project.githubUrl;
  document.title = `${project.name} · Hub académico POO 2026-2`;
  contentElement.hidden = false;
  statusElement.hidden = true;
}

function resolveReadmeUrl(value, repoUrl, image = false) {
  if (!value || value.startsWith('#')) return value;
  try {
    const [owner, repo] = repositoryParts(repoUrl);
    const base = image
      ? `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`
      : `https://github.com/${owner}/${repo}/blob/HEAD/`;
    const url = value.startsWith('/') ? new URL(value, 'https://github.com') : new URL(value, base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

// GitHub devuelve HTML, que se copia con una lista cerrada de elementos y atributos.
function sanitizeReadme(html, repoUrl) {
  const allowed = new Set(['p','h1','h2','h3','h4','h5','h6','a','img','pre','code','blockquote','ul','ol','li','strong','em','b','i','br','hr','table','thead','tbody','tr','th','td','del','s','details','summary','div','span','sup','sub','kbd']);
  const discarded = new Set(['script','style','iframe','object','embed','form','svg','math','video','audio','picture','source','canvas']);
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const fragment = document.createDocumentFragment();

  function copy(source, target) {
    for (const child of source.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        target.append(document.createTextNode(child.textContent));
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();
      if (discarded.has(tag)) continue;
      if (!allowed.has(tag)) {
        copy(child, target);
        continue;
      }
      const clean = document.createElement(tag);
      if (tag === 'a') {
        const href = resolveReadmeUrl(child.getAttribute('href'), repoUrl);
        if (href) clean.setAttribute('href', href);
        if (href && !href.startsWith('#')) {
          clean.setAttribute('target', '_blank');
          clean.setAttribute('rel', 'noopener noreferrer');
        }
      }
      if (tag === 'img') {
        const src = resolveReadmeUrl(child.getAttribute('src'), repoUrl, true);
        if (!src) continue;
        clean.setAttribute('src', src);
        clean.setAttribute('alt', child.getAttribute('alt') || '');
        clean.setAttribute('loading', 'lazy');
      }
      if (/^h[1-6]$/.test(tag)) {
        const id = child.getAttribute('id');
        if (id && /^[\w-]+$/.test(id)) clean.setAttribute('id', id);
      }
      copy(child, clean);
      target.append(clean);
    }
  }
  copy(parsed.body, fragment);
  return fragment;
}

function addTechnicalField(label, value, link = false) {
  if (value === null || value === undefined || value === '') return;
  const grid = document.getElementById('technicalGrid');
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  if (link) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) return;
      const anchor = document.createElement('a');
      anchor.href = url.href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = url.hostname + url.pathname.replace(/\/$/, '');
      description.append(anchor);
    } catch {
      return;
    }
  } else {
    description.textContent = String(value);
  }
  grid.append(term, description);
}

function formatGitHubDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(date);
}

function renderTopics(topics) {
  if (!Array.isArray(topics) || topics.length === 0) return;
  const list = document.getElementById('topicsList');
  for (const topic of topics) {
    const chip = document.createElement('span');
    chip.textContent = topic;
    list.append(chip);
  }
  document.getElementById('topicsBlock').hidden = false;
}

async function loadGitHubInfo(project) {
  const [owner, repo] = repositoryParts(project.githubUrl);
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const status = document.getElementById('technicalStatus');
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.description) document.getElementById('detailDescription').textContent = data.description;
    document.getElementById('detailName').textContent = data.name || project.name;
    addTechnicalField('Cuenta de GitHub', data.owner?.login || owner);
    addTechnicalField('Lenguaje principal', data.language || 'No identificado');
    addTechnicalField('Licencia', data.license?.name || 'Sin licencia declarada');
    addTechnicalField('Rama principal', data.default_branch);
    addTechnicalField('Creado', formatGitHubDate(data.created_at));
    addTechnicalField('Última actualización', formatGitHubDate(data.updated_at));
    addTechnicalField('Último código publicado', formatGitHubDate(data.pushed_at));
    if (Number.isFinite(data.size)) addTechnicalField('Tamaño del repositorio', `${new Intl.NumberFormat('es-CO').format(data.size)} KB`);
    addTechnicalField('Estado', data.archived ? 'Archivado' : 'Activo');
    addTechnicalField('Sitio del proyecto', data.homepage, true);
    renderTopics(data.topics);
    document.getElementById('technicalGrid').hidden = false;
    status.hidden = true;
  } catch (error) {
    console.warn('No se pudieron cargar los metadatos de GitHub:', error);
    status.textContent = 'No se pudo consultar la ficha técnica en GitHub. El enlace al repositorio sigue disponible.';
  }
}

async function loadLanguages(project) {
  const [owner, repo] = repositoryParts(project.githubUrl);
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;
  const status = document.getElementById('languagesStatus');
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const languages = await response.json();
    const entries = Object.entries(languages).filter(([, bytes]) => Number.isFinite(bytes) && bytes > 0).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      status.textContent = 'GitHub no reporta lenguajes para este repositorio.';
      return;
    }
    const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
    const list = document.getElementById('languagesList');
    for (const [name, bytes] of entries) {
      const row = document.createElement('div');
      row.className = 'language-row';
      const heading = document.createElement('div');
      heading.className = 'language-heading';
      const label = document.createElement('strong');
      label.textContent = name;
      const percentage = document.createElement('span');
      percentage.textContent = `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(bytes / total * 100)} %`;
      heading.append(label, percentage);
      const track = document.createElement('div');
      track.className = 'language-track';
      const bar = document.createElement('div');
      bar.className = 'language-bar';
      bar.style.width = `${bytes / total * 100}%`;
      track.append(bar);
      row.append(heading, track);
      list.append(row);
    }
    status.textContent = 'Distribución aproximada según los bytes de código que reporta GitHub.';
  } catch (error) {
    console.warn('No se pudieron cargar los lenguajes:', error);
    status.textContent = 'No se pudo consultar el desglose de lenguajes en GitHub.';
  }
}

async function loadReadme(project) {
  const [owner, repo] = repositoryParts(project.githubUrl);
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/vnd.github.html+json' } });
    if (response.status === 404) {
      setReadmeMessage('Este repositorio no tiene un README público disponible.', project.githubUrl);
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const content = sanitizeReadme(html, project.githubUrl);
    if (!content.hasChildNodes()) {
      setReadmeMessage('El README está vacío o no se pudo mostrar.', project.githubUrl);
      return;
    }
    readmeElement.replaceChildren(content);
  } catch (error) {
    console.warn('No se pudo cargar el README:', error);
    setReadmeMessage('No se pudo cargar el README desde GitHub en este momento.', project.githubUrl);
  }
}

async function initDetail() {
  const selected = new URLSearchParams(location.search).get('repo');
  const selectedStudent = new URLSearchParams(location.search).get('student');
  if (!selected) {
    statusElement.textContent = 'No se indicó un proyecto. Vuelve al catálogo y selecciona uno.';
    return;
  }
  try {
    const response = await fetch('data/projects.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    let project = null;
    if (selectedStudent) {
      project = catalog.projects.find(item => {
        try {
          return new URL(item.githubUrl).pathname.slice(1).toLowerCase() === selected.toLowerCase() &&
                 item.student.toLowerCase() === selectedStudent.toLowerCase();
        } catch {
          return false;
        }
      });
    }
    if (!project) {
      project = catalog.projects.find(item => {
        try {
          return new URL(item.githubUrl).pathname.slice(1).toLowerCase() === selected.toLowerCase();
        } catch {
          return false;
        }
      });
    }
    if (!project) {
      statusElement.textContent = 'Este proyecto no está en el catálogo. Vuelve y selecciona uno de la lista.';
      return;
    }
    setProject(project, catalog.categories, catalog.projects);
    await Promise.all([loadGitHubInfo(project), loadLanguages(project), loadReadme(project)]);
  } catch (error) {
    console.error('No se pudo abrir el proyecto:', error);
    statusElement.textContent = 'No se pudo cargar el proyecto. Abre la página desde un servidor local e inténtalo de nuevo.';
  }
}

initDetail();
