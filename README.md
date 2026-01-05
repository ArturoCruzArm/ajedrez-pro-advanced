# Ajedrez con IA

Un juego de ajedrez web interactivo donde puedes jugar contra una inteligencia artificial. Implementado con HTML, CSS y JavaScript puro, utilizando chess.js para la lógica del juego y chessboard.js para la interfaz visual.

## Características

- **Juega contra la IA**: Motor de ajedrez basado en el algoritmo minimax con poda alfa-beta
- **5 niveles de dificultad**: Desde muy fácil hasta experto
- **Interfaz intuitiva**: Arrastra y suelta las piezas para mover
- **Validación completa**: Todos los movimientos son validados según las reglas oficiales del ajedrez
- **Detección automática**: Jaque mate, empate, ahogado, triple repetición y material insuficiente
- **Diseño responsive**: Funciona perfectamente en móviles, tablets y ordenadores
- **Temas visuales**: Interfaz moderna y elegante

## Cómo jugar

1. Selecciona tu color (blancas o negras)
2. Elige el nivel de dificultad
3. Arrastra las piezas para hacer tus movimientos
4. La IA responderá automáticamente
5. Usa "Nueva Partida" para reiniciar el juego

## Tecnologías utilizadas

- **HTML5**: Estructura de la página
- **CSS3**: Estilos y animaciones
- **JavaScript**: Lógica del juego
- **chess.js**: Librería para la lógica y reglas del ajedrez
- **chessboard.js**: Librería para la interfaz visual del tablero
- **Bootstrap 5**: Framework CSS para diseño responsive
- **jQuery**: Manipulación del DOM

## Despliegue en GitHub Pages

Este proyecto está configurado para ser desplegado en GitHub Pages. Sigue estos pasos:

1. **Crea un repositorio en GitHub**:
   - Ve a https://github.com/new
   - Nombra tu repositorio (ej: "chess-game")
   - Hazlo público
   - No inicialices con README (ya lo tenemos)

2. **Sube el código al repositorio**:
   ```bash
   cd chess-game
   git init
   git add .
   git commit -m "Implementación inicial del juego de ajedrez"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```

3. **Habilita GitHub Pages**:
   - Ve a tu repositorio en GitHub
   - Settings > Pages
   - En "Source", selecciona "Deploy from a branch"
   - Selecciona la rama "main" y la carpeta "/ (root)"
   - Haz clic en "Save"

4. **Accede a tu juego**:
   - Espera unos minutos para que se despliegue
   - Tu juego estará disponible en: `https://TU-USUARIO.github.io/TU-REPOSITORIO/`

## Probar localmente

Para probar el juego en tu ordenador antes de subirlo a GitHub:

1. Abre una terminal en la carpeta del proyecto
2. Inicia un servidor local (elige uno):
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
   - Node.js: `npx http-server`
3. Abre tu navegador en `http://localhost:8000`

**Nota**: No abras el archivo HTML directamente en el navegador, ya que algunas funcionalidades pueden no funcionar correctamente debido a restricciones CORS.

## Estructura del proyecto

```
chess-game/
├── index.html          # Página principal
├── css/
│   └── styles.css     # Estilos personalizados
├── js/
│   └── main.js        # Lógica del juego y motor de IA
└── README.md          # Este archivo
```

## Cómo funciona la IA

El motor de IA utiliza el algoritmo **minimax con poda alfa-beta** para calcular el mejor movimiento:

1. **Evaluación de posición**: Cada pieza tiene un valor, y la posición en el tablero también afecta la puntuación
2. **Búsqueda en profundidad**: La IA explora varios movimientos hacia adelante
3. **Poda alfa-beta**: Optimización que descarta ramas del árbol de búsqueda que no mejorarán el resultado
4. **Niveles de dificultad**: Ajustan la profundidad de búsqueda (1-5 movimientos hacia adelante)

## Mejoras futuras

- Integración con Stockfish.js para una IA más fuerte
- Historial de movimientos con notación algebraica
- Función de deshacer movimientos
- Exportar/importar partidas en formato PGN
- Modo multijugador local
- Reloj de ajedrez
- Temas de tablero personalizables
- Análisis de partida

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Créditos

- **chess.js**: Librería de lógica de ajedrez por Jeff Hlywa
- **chessboard.js**: Librería de interfaz de tablero por Chris Oakman
- **Piezas de ajedrez**: Wikipedia (dominio público)

---

Hecho con por un entusiasta del ajedrez
