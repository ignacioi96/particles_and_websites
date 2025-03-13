function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  function mapRange(value, inMin, inMax, outMin, outMax) {
    if (isNaN(value) || value === undefined) return outMin;
    return Math.max(outMin, Math.min(outMax, ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin));
  }
  
  function interpolateColors(color1, color2, factor) {
    const parseColor = (hex) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  
    const [r1, g1, b1] = parseColor(color1);
    const [r2, g2, b2] = parseColor(color2);
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
  
    return `rgb(${r}, ${g}, ${b})`;
  }
  