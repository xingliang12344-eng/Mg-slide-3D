(() => {
  const root = document.getElementById('corrosionCalculator');
  if (!root) return;

  const fields = {
    volume: document.getElementById('corrosionH2Volume'),
    temperature: document.getElementById('corrosionTemperature'),
    pressure: document.getElementById('corrosionPressure'),
    time: document.getElementById('corrosionTime'),
    timeUnit: document.getElementById('corrosionTimeUnit'),
    mgPercent: document.getElementById('corrosionMgPercent'),
    area: document.getElementById('corrosionArea'),
    waterCorrection: document.getElementById('corrosionWaterCorrection')
  };
  const outputs = {
    message: document.getElementById('corrosionMessage'),
    mgLoss: document.getElementById('corrosionMgLoss'),
    alloyLoss: document.getElementById('corrosionAlloyLoss'),
    hourlyRate: document.getElementById('corrosionHourlyRate'),
    areaRate: document.getElementById('corrosionAreaRate'),
    gasMoles: document.getElementById('corrosionGasMoles'),
    dryPressure: document.getElementById('corrosionDryPressure')
  };
  const GAS_CONSTANT = 8.314462618;
  const MG_MOLAR_MASS = 24.305;
  const HPA_PER_KPA = 10;

  function waterVaporPressureKpa(tempC) {
    // Buck equation for saturation water-vapor pressure over liquid water.
    return 0.61121 * Math.exp((18.678 - tempC / 234.5) * (tempC / (257.14 + tempC)));
  }

  function clearResults() {
    outputs.mgLoss.textContent = '—';
    outputs.alloyLoss.textContent = '—';
    outputs.hourlyRate.textContent = '—';
    outputs.areaRate.textContent = '—';
    outputs.gasMoles.textContent = '—';
    outputs.dryPressure.textContent = '—';
  }

  function calculate() {
    const volumeMl = Number(fields.volume.value);
    const tempC = Number(fields.temperature.value);
    const totalPressureKpa = Number(fields.pressure.value);
    const timeValue = Number(fields.time.value);
    const timeHours = timeValue * (fields.timeUnit.value === 'day' ? 24 : 1);
    const mgPercent = Number(fields.mgPercent.value);
    const areaValue = fields.area.value.trim();
    const areaCm2 = areaValue === '' ? null : Number(areaValue);
    const valuesValid =
      Number.isFinite(volumeMl) && volumeMl > 0 &&
      Number.isFinite(tempC) && tempC >= -20 && tempC <= 50 &&
      Number.isFinite(totalPressureKpa) && totalPressureKpa > 0 &&
      Number.isFinite(timeHours) && timeHours > 0 &&
      Number.isFinite(mgPercent) && mgPercent > 0 && mgPercent <= 100 &&
      (areaCm2 === null || (Number.isFinite(areaCm2) && areaCm2 > 0));
    if (!valuesValid) {
      outputs.message.textContent = '请填写有效数据：氢气体积、腐蚀时间和 Mg 含量须大于 0；Mg 含量不能超过 100%。温度范围为 −20 至 50 °C。';
      outputs.message.className = 'casting-message error';
      clearResults();
      return;
    }

    const vaporPressureKpa = fields.waterCorrection.checked ? waterVaporPressureKpa(tempC) : 0;
    const hydrogenPressureKpa = totalPressureKpa - vaporPressureKpa;
    if (hydrogenPressureKpa <= 0) {
      outputs.message.textContent = '扣除水蒸气分压后，氢气分压必须大于 0；请核对温度和压力。';
      outputs.message.className = 'casting-message error';
      clearResults();
      return;
    }
    const gasVolumeM3 = volumeMl * 1e-6;
    const pressurePa = hydrogenPressureKpa * 1000;
    const temperatureK = tempC + 273.15;
    const hydrogenMoles = pressurePa * gasVolumeM3 / (GAS_CONSTANT * temperatureK);
    const magnesiumEquivalentG = hydrogenMoles * MG_MOLAR_MASS;
    const alloyLossG = magnesiumEquivalentG / (mgPercent / 100);
    const hourlyRateMg = alloyLossG * 1000 / timeHours;
    outputs.message.textContent = '已按理想气体状态方程和 Mg:H₂ = 1:1 摩尔关系估算。';
    outputs.message.className = 'casting-message success';
    outputs.gasMoles.textContent = hydrogenMoles.toExponential(4) + ' mol';
    outputs.dryPressure.textContent = hydrogenPressureKpa.toFixed(3) + ' kPa';
    outputs.mgLoss.textContent = (magnesiumEquivalentG * 1000).toFixed(4) + ' mg';
    outputs.alloyLoss.textContent = alloyLossG.toFixed(6) + ' g (' + (alloyLossG * 1000).toFixed(4) + ' mg)';
    outputs.hourlyRate.textContent = hourlyRateMg.toFixed(4) + ' mg/h';
    outputs.areaRate.textContent = areaCm2 === null
      ? '输入暴露面积后计算'
      : (hourlyRateMg * 24 / areaCm2).toFixed(4) + ' mg/(cm²·d)';
  }

  Object.values(fields).forEach(field => {
    field.addEventListener('input', calculate);
    field.addEventListener('change', calculate);
  });
  calculate();
})();