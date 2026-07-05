// app.js
let todos = JSON.parse(localStorage.getItem('funkoTodos')) || [];
let timerInterval;
let timeLeft = 25 * 60;
let isRunning = false;

// Render Todos
function renderTodos() {
  const container = document.getElementById('tdo-list');
  container.innerHTML = '';

  todos.forEach((todo, index) => {
    const div = document.createElement('div');
    div.className = `flex items-center gap-3 bg-gray-800/70 rounded-2xl p-4 group transition-all`;
    div.innerHTML = `
      <input type="checkbox" ${todo.done ? 'checked' : ''} 
             class="w-5 h-5 accent-emerald-500" 
             onchange="toggleDone(${index})">
      <span class="flex-1 ${todo.done ? 'task-done' : ''}">${todo.text}</span>
      <button onclick="deleteTodo(${index})" 
              class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    container.appendChild(div);
  });

  document.getElementById('task-count').textContent = `${todos.length} tasks`;
}

// Add Todo
function addTodo() {
  const input = document.getElementById('todo-input');
  if (!input.value.trim()) return;

  todos.push({ text: input.value.trim(), done: false });
  localStorage.setItem('funkoTodos', JSON.stringify(todos));
  input.value = '';
  renderTodos();
}

// Toggle Done
function toggleDone(index) {
  todos[index].done = !todos[index].done;
  localStorage.setItem('funkoTodos', JSON.stringify(todos));
  renderTodos();
}

// Delete Todo
function deleteTodo(index) {
  todos.splice(index, 1);
  localStorage.setItem('funkoTodos', JSON.stringify(todos));
  renderTodos();
}

// Timer Functions
function updateTimerDisplay() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  document.getElementById('timer').textContent = 
    `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      new Audio('https://freesound.org/data/previews/66/66929_931655-lq.mp3').play().catch(()=>{});
      alert("🎉 Focus session completed! Take a break.");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timeLeft = 25 * 60;
  updateTimerDisplay();
}

// Remembering Note
function initNote() {
  const noteArea = document.getElementById('quick-note');
  noteArea.value = localStorage.getItem('funkoRemembering') || '';

  noteArea.addEventListener('input', () => {
    localStorage.setItem('funkoRemembering', noteArea.value);
  });
}

// Initialize Everything
function init() {
  renderTodos();
  updateTimerDisplay();
  initNote();
}

// Make functions global so onclick works
window.addTodo = addTodo;
window.toggleDone = toggleDone;
window.deleteTodo = deleteTodo;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
