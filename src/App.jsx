import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  
  // Параметры по умолчанию
  const [params, setParams] = useState({
    velocity: 50,
    angle: 45,
    dragCoefficient: 0.1,
    mass: 1,
    gravity: 9.81,
    timeStep: 0.01
  });

  const [trajectory, setTrajectory] = useState([]);
  const [flightData, setFlightData] = useState({
    maxHeight: 0,
    maxDistance: 0,
    flightTime: 0
  });

  // Функция расчёта траектории
  const calculateTrajectory = () => {
    const {
      velocity: v0,
      angle: angleDeg,
      dragCoefficient: k,
      mass: m,
      gravity: g,
      timeStep: dt
    } = params;

    // Начальные условия
    const angle = (angleDeg * Math.PI) / 180;
    let x = 0;
    let y = 0;
    let vx = v0 * Math.cos(angle);
    let vy = v0 * Math.sin(angle);
    
    const points = [[x, y]];
    let maxY = 0;
    let time = 0;

    // Численное моделирование
    while (y >= 0) {
      // Скорость
      const v = Math.sqrt(vx * vx + vy * vy);
      
      // Сила сопротивления (пропорциональна квадрату скорости)
      const dragForce = k * v * v;
      
      // Ускорения
      const ax = v === 0 ? 0 : -(dragForce / m) * (vx / v);
      const ay = -g - (v === 0 ? 0 : (dragForce / m) * (vy / v));
      
      // Обновление скорости
      vx += ax * dt;
      vy += ay * dt;
      
      // Обновление координат
      x += vx * dt;
      y += vy * dt;
      
      // Сохраняем точку
      if (y >= 0) {
        points.push([x, y]);
        maxY = Math.max(maxY, y);
      }
      
      time += dt;
      
      // Защита от бесконечного цикла
      if (time > 100) break;
    }

    setTrajectory(points);
    setFlightData({
      maxHeight: maxY.toFixed(2),
      maxDistance: x.toFixed(2),
      flightTime: time.toFixed(2)
    });

    drawTrajectory(points);
  };

  // Функция отрисовки траектории
  const drawTrajectory = (points) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Очистка canvas
    ctx.clearRect(0, 0, width, height);

    // Находим максимальные значения для масштабирования
    const maxX = Math.max(...points.map(p => p[0]), 1);
    const maxY = Math.max(...points.map(p => p[1]), 1);
    
    // Отступы от краёв
    const padding = 40;
    const scaleX = (width - 2 * padding) / maxX;
    const scaleY = (height - 2 * padding) / maxY;

    // Рисуем оси
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding, padding);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('X (расстояние, м)', width - 100, height - 10);
    ctx.fillText('Y (высота, м)', 10, 20);

    if (points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      
      const screenPoints = points.map(([x, y]) => [
        padding + x * scaleX,
        height - padding - y * scaleY
      ]);
      
      ctx.moveTo(screenPoints[0][0], screenPoints[0][1]);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i][0], screenPoints[i][1]);
      }
      ctx.stroke();

    }

    // Сетка 
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 5; i++) {
      const x = padding + (i * (width - 2 * padding) / 5);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i * (height - 2 * padding) / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  };

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.moveTo(40, canvas.height - 40);
      ctx.lineTo(canvas.width - 40, canvas.height - 40);
      ctx.moveTo(40, canvas.height - 40);
      ctx.lineTo(40, 40);
      ctx.stroke();
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Визуализатор полёта снаряда с сопротивлением воздуха</h1>
      </header>

      <div className="main-container">
        <div className="control-panel">
          <h2>Параметры полёта</h2>
          
          <div className="param-group">
            <label>
              Начальная скорость (м/с):
              <input
                type="range"
                name="velocity"
                min="10"
                max="100"
                step="1"
                value={params.velocity}
                onChange={handleParamChange}
              />
              <span className="param-value">{params.velocity}</span>
            </label>
          </div>

          <div className="param-group">
            <label>
              Угол броска (градусы):
              <input
                type="range"
                name="angle"
                min="0"
                max="90"
                step="1"
                value={params.angle}
                onChange={handleParamChange}
              />
              <span className="param-value">{params.angle}</span>
            </label>
          </div>

          <div className="param-group">
            <label>
              Коэффициент сопротивления:
              <input
                type="range"
                name="dragCoefficient"
                min="0"
                max="0.5"
                step="0.01"
                value={params.dragCoefficient}
                onChange={handleParamChange}
              />
              <span className="param-value">{params.dragCoefficient.toFixed(2)}</span>
            </label>
          </div>

          <div className="param-group">
            <label>
              Масса снаряда (кг):
              <input
                type="range"
                name="mass"
                min="0.5"
                max="5"
                step="0.1"
                value={params.mass}
                onChange={handleParamChange}
              />
              <span className="param-value">{params.mass.toFixed(1)}</span>
            </label>
          </div>

          <button className="calculate-btn" onClick={calculateTrajectory}>
            Рассчитать траекторию
          </button>

          <div className="results-panel">
            <h3>Результаты расчёта:</h3>
            <div className="result-item">
              <span>Макс. высота:</span>
              <strong>{flightData.maxHeight} м</strong>
            </div>
            <div className="result-item">
              <span>Дальность полёта:</span>
              <strong>{flightData.maxDistance} м</strong>
            </div>
            <div className="result-item">
              <span>Время полёта:</span>
              <strong>{flightData.flightTime} с</strong>
            </div>
          </div>

          <div className="info-text">
            <p>Модель учитывает силу сопротивления воздуха, пропорциональную квадрату скорости.</p>
          </div>
        </div>

        <div className="canvas-container">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={500}
            className="trajectory-canvas"
          />
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>© 2026 | <strong>Маматова Наталья Андреевна</strong></p>
          <p>Индивидуальный проект по физике</p>
          <p>Новосибирский Колледж Печати и Информационных Техонологий</p>
        </div>
      </footer>

    </div>
  );
}

export default App;