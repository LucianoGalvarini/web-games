# Juegos de mesa

Ocho clásicos en el navegador: Fanorona, Molino, Damas, Buscaminas, Sudoku, Truco, Tetris y Ajedrez. La interfaz está en español. Al abrir se elige el juego; cada uno conserva sus reglas.

Sitio: [lucianogalvarini.github.io/web-games](https://lucianogalvarini.github.io/web-games/)

Fanorona, Molino, Damas, Truco y Ajedrez arrancan contra la CPU. Buscaminas, Sudoku y Tetris se juegan en solitario.

## Documentación

Cada juego tiene su propia página:

- [Fanorona](docs/fanorona.md)
- [Molino](docs/molino.md)
- [Damas](docs/damas.md)
- [Buscaminas](docs/buscaminas.md)
- [Sudoku](docs/sudoku.md)
- [Truco](docs/truco.md)
- [Tetris](docs/tetris.md)
- [Ajedrez](docs/ajedrez.md)
- [Arquitectura](docs/arquitectura.md)

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Typecheck (`tsc -b`) + build de producción |
| `npm run preview` | Sirve el build de `dist/` |
| `npm run lint` | Oxlint |

Stack: Vite 8, React 19, TypeScript. CSS propio, sin librería de componentes. Tipografías Cormorant Garamond y Outfit.

Desde el panel se vuelve al menú con **Elegir juego**.
