# Hub académico · POO 2026-2

Repositorio central de aplicaciones creadas por estudiantes en la asignatura de Programación Orientada a Objetos.

El catálogo muestra los 17 repositorios del [listado del Parcial III](docs/repositorios_github_parcial_III_POO_3E.md). Cada tarjeta abre una ficha dentro del hub con descripción, cuenta de GitHub, lenguaje principal, distribución de lenguajes, licencia, rama principal, fechas, tamaño, temas, sitio del proyecto y el README que escribió el estudiante, según los datos públicos disponibles. La ficha incluye un botón para abrir GitHub. Se puede buscar por proyecto o estudiante y filtrar por tipo de aplicación. Las categorías se infieren del nombre de cada repositorio; cuando este no permite identificar el tipo, se usa «Otros proyectos».

## Ejecutar localmente

Desde la raíz del proyecto:

```bash
python3 -m http.server 8080
```

Abrir `http://localhost:8080`. El navegador necesita un servidor local para cargar `data/projects.json`.

La ficha consulta la API pública de GitHub al abrirse. La distribución de lenguajes usa los bytes de código que reporta GitHub; no es un recuento de líneas. Si un repositorio no tiene README, no es público o GitHub limita las consultas, se muestra un mensaje y se conserva el enlace al repositorio.

## Actualizar el catálogo

El documento de `docs/` contiene las direcciones originales. La página lee `data/projects.json`; al agregar o corregir un repositorio, actualiza el nombre del estudiante, la URL y la categoría en ese archivo. No se consultan estrellas, calificaciones ni datos de popularidad.
