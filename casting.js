(() => {
  const root = document.getElementById('castingCalculator');
  if (!root) return;

  const state = { elements: [] };
  const catalog = [
    ['Al','铝'],['Zn','锌'],['Mn','锰'],['Ca','钙'],['Zr','锆'],
    ['Si','硅'],['Sn','锡'],['Li','锂'],['Y','钇'],['Nd','钕'],
    ['Gd','钆'],['Cu','铜'],['Ag','银'],['Sr','锶']
  ];
  const rows = document.getElementById('castingRows');
  const select = document.getElementById('castingElementSelect');
  const addButton = document.getElementById('addCastingElement');
  const modeSelect = document.getElementById('castingMode');
  const amountInput = document.getElementById('castingAmount');
  const sumOutput = document.getElementById('castingSum');
  const message = document.getElementById('castingMessage');
  const resultBody = document.getElementById('castingResultBody');
  const totalOutput = document.getElementById('castingTotal');

  catalog.forEach(([symbol, name]) => {
    const option = document.createElement('option');
    option.value = symbol;
    option.textContent = name + ' (' + symbol + ')';
    select.append(option);
  });

  function renderRows() {
    rows.replaceChildren();
    const all = [{ symbol: 'Mg', name: '镁', percent: 100, fixed: true }, ...state.elements];
    all.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'casting-row';
      const name = document.createElement('div');
      name.className = 'casting-element-name';
      name.innerHTML = '<span class="casting-symbol"></span><span class="casting-name"></span>';
      name.querySelector('.casting-symbol').textContent = item.symbol;
      name.querySelector('.casting-name').textContent = item.name;
      const inputWrap = document.createElement('label');
      inputWrap.className = 'casting-percent';
      inputWrap.innerHTML = '<span>wt.%</span><input type="number" min="0" max="100" step="0.01" inputmode="decimal" aria-label="wt.%">';
      const input = inputWrap.querySelector('input');
      input.value = item.fixed ? '100' : String(item.percent);
      input.disabled = item.fixed;
      input.addEventListener('input', () => {
        item.percent = input.value === '' ? 0 : Number(input.value);
        calculate();
      });
      row.append(name, inputWrap);
      if (!item.fixed) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'casting-remove';
        remove.textContent = '移除';
        remove.setAttribute('aria-label', '移除' + item.name);
        remove.addEventListener('click', () => {
          state.elements = state.elements.filter(element => element !== item);
          renderRows();
          calculate();
        });
        row.append(remove);
      } else {
        const required = document.createElement('span');
        required.className = 'casting-required';
        required.textContent = '必选';
        row.append(required);
      }
      rows.append(row);
    });
    const used = new Set(state.elements.map(item => item.symbol));
    [...select.options].forEach(option => { option.disabled = used.has(option.value); });
    select.value = [...select.options].find(option => !option.disabled)?.value || '';
    addButton.disabled = !select.value;
  }

  function calculate() {
    const all = [{ symbol: 'Mg', name: '镁', percent: 100 }, ...state.elements];
    const totalPercent = all.reduce((sum, item) => sum + (Number(item.percent) || 0), 0);
    sumOutput.textContent = totalPercent.toFixed(2) + ' wt.%';
    const validPercentages = all.every(item => Number.isFinite(Number(item.percent)) && Number(item.percent) >= 0 && Number(item.percent) <= 100);
    const amount = Number(amountInput.value);
    const validAmount = Number.isFinite(amount) && amount > 0;
    const balanced = Math.abs(totalPercent - 100) <= 0.01;
    if (!validPercentages) {
      message.textContent = '每种元素的 wt.% 必须在 0 到 100 之间。';
      message.className = 'casting-message error';
      showNoResult();
      return;
    }
    if (!balanced) {
      message.textContent = '当前成分合计 ' + totalPercent.toFixed(2) + ' wt.%；请调整到 100 wt.% 后再计算。';
      message.className = 'casting-message error';
      showNoResult();
      return;
    }
    if (!validAmount) {
      message.textContent = '请输入大于 0 的重量。';
      message.className = 'casting-message error';
      showNoResult();
      return;
    }
    const mode = modeSelect.value;
    const totalMass = mode === 'target' ? amount : amount / (100 / 100);
    const batchTotal = mode === 'target' ? amount : amount / (100 / 100);
    const magnesiumMass = mode === 'target' ? totalMass * (all[0].percent / 100) : amount;
    const actualTotal = mode === 'target' ? totalMass : magnesiumMass / (all[0].percent / 100);
    resultBody.replaceChildren();
    all.forEach(item => {
      const tr = document.createElement('tr');
      const elementCell = document.createElement('td');
      elementCell.textContent = item.name + ' (' + item.symbol + ')';
      const percentCell = document.createElement('td');
      percentCell.textContent = Number(item.percent).toFixed(2) + '%';
      const massCell = document.createElement('td');
      const mass = item.symbol === 'Mg' ? magnesiumMass : actualTotal * (Number(item.percent) / 100);
      massCell.textContent = mass.toFixed(4) + ' g';
      tr.append(elementCell, percentCell, massCell);
      resultBody.append(tr);
    });
    totalOutput.textContent = actualTotal.toFixed(4) + ' g';
    message.textContent = mode === 'target'
      ? '已按目标铸锭重量换算理论投料量。'
      : '已按 Mg 实际称量反算其他元素及理论铸锭总重。';
    message.className = 'casting-message success';
  }

  function showNoResult() {
    resultBody.replaceChildren();
    totalOutput.textContent = '—';
  }

  addButton.addEventListener('click', () => {
    const symbol = select.value;
    const item = catalog.find(entry => entry[0] === symbol);
    if (!item || state.elements.some(element => element.symbol === symbol)) return;
    state.elements.push({ symbol: item[0], name: item[1], percent: 0 });
    renderRows();
    calculate();
  });
  modeSelect.addEventListener('change', () => {
    const isTarget = modeSelect.value === 'target';
    document.getElementById('castingAmountLabel').textContent = isTarget ? '目标铸锭重量' : '实际 Mg 称量';
    document.getElementById('castingAmountUnit').textContent = 'g';
    amountInput.value = isTarget ? '100' : '100';
    calculate();
  });
  amountInput.addEventListener('input', calculate);

  renderRows();
  calculate();
})();