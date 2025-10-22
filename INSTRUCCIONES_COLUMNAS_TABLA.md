# 📊 INSTRUCCIONES PARA CAMBIAR EL ANCHO DE COLUMNAS DE LA TABLA

## 🎯 Ubicación del Archivo
El ancho de las columnas se controla en: `frontend/src/pages/Home.css`

## 🔧 Cómo Cambiar el Ancho de las Columnas

### 1. **Estructura de la Tabla**
La tabla tiene 6 columnas en este orden:
1. **Checkbox/Info** (botón del ojo)
2. **Título del Trend** 
3. **Link del Trend**
4. **Nombre Newsletter Relacionado**
5. **Fecha Relación**
6. **Eliminar**

### 2. **Modificar el Ancho de Columnas Específicas**

#### Para cambiar la columna "Título del Trend" (columna 2):
```css
/* Columna 2: Título del Trend */
.trends-table th:nth-child(2),
.trends-table td:nth-child(2) {
  width: 35%; /* Cambia este valor */
}
```

#### Para cambiar la columna "Link del Trend" (columna 3):
```css
/* Columna 3: Link del Trend */
.trends-table th:nth-child(3),
.trends-table td:nth-child(3) {
  width: 20%; /* Cambia este valor */
}
```

### 3. **Valores Disponibles para el Ancho**

- **Porcentajes**: `width: 20%` (recomendado)
- **Píxeles**: `width: 200px`
- **Valores relativos**: `width: 2fr` (si usas CSS Grid)

### 4. **Ejemplos de Cambios**

#### Hacer la columna "Título del Trend" más ancha:
```css
.trends-table th:nth-child(2),
.trends-table td:nth-child(2) {
  width: 40%; /* Era 35%, ahora es 40% */
}
```

#### Hacer la columna "Link del Trend" más angosta:
```css
.trends-table th:nth-child(3),
.trends-table td:nth-child(3) {
  width: 15%; /* Era 20%, ahora es 15% */
}
```

### 5. **Reglas Importantes**

⚠️ **IMPORTANTE**: La suma de todos los anchos debe ser 100% o menos:
- Columna 1: 8%
- Columna 2: 35% 
- Columna 3: 20%
- Columna 4: 25%
- Columna 5: 20%
- Columna 6: 10%
- **Total: 118%** (esto está bien porque algunas columnas pueden ser más flexibles)

### 6. **Hacer Columnas Flexibles**

Si quieres que una columna se ajuste automáticamente:
```css
.trends-table th:nth-child(4),
.trends-table td:nth-child(4) {
  width: auto; /* Se ajusta automáticamente */
}
```

### 7. **Cambios Rápidos Comunes**

#### Para dar más espacio al título:
```css
/* Aumentar título del trend */
.trends-table th:nth-child(2),
.trends-table td:nth-child(2) {
  width: 40%;
}

/* Reducir link del trend */
.trends-table th:nth-child(3),
.trends-table td:nth-child(3) {
  width: 15%;
}
```

#### Para dar más espacio al link:
```css
/* Reducir título del trend */
.trends-table th:nth-child(2),
.trends-table td:nth-child(2) {
  width: 30%;
}

/* Aumentar link del trend */
.trends-table th:nth-child(3),
.trends-table td:nth-child(3) {
  width: 25%;
}
```

## 🚀 Después de Hacer Cambios

1. Guarda el archivo `Home.css`
2. El navegador se recargará automáticamente (hot reload)
3. Los cambios se verán inmediatamente en la tabla

## 💡 Consejos

- **Prueba con porcentajes pequeños** primero (1-2%)
- **Mantén la proporción** entre columnas relacionadas
- **Usa el inspector del navegador** para ver el resultado en tiempo real
- **Considera el contenido** de cada columna al asignar anchos
- **Todas las columnas ahora permiten wrap del texto** para mejor legibilidad

## 🔍 Verificar Cambios

Para verificar que tus cambios funcionaron:
1. Abre la página Home en el navegador
2. Inspecciona la tabla con F12
3. Verifica que las columnas tengan el ancho deseado
4. Ajusta los valores si es necesario
5. Confirma que el texto se envuelve correctamente en todas las columnas
