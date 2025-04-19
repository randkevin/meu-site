const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 5500;

// Configuração para ler o corpo das requisições
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração da sessão
app.use(session({
  secret: 'flashcards-japones-secreto',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Em produção, use secure: true com HTTPS
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Banco de dados simulado (em produção, use um banco de dados real)
const users = [];
const userProgress = {};

// Rota para a página inicial (login)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para a página principal dos flashcards
app.get('/Site.html', (req, res) => {
  if (!req.session.userId) {
    // Redirecionar para login se não estiver logado
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'Site.html'));
});

// Endpoint para registrar novo usuário
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  
  // Verificar se o email já existe
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.json({ success: false, message: 'Email já registrado' });
  }
  
  // Criar novo usuário
  const newUser = { id: users.length + 1, name, email, password };
  users.push(newUser);
  
  // Inicializar o progresso do usuário
  userProgress[newUser.id] = { cards: [], counters: { easy: 0, medium: 0, hard: 0 } };
  
  res.json({ success: true });
});

// Endpoint para login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Procurar usuário
  const user = users.find(user => user.email === email && user.password === password);
  if (!user) {
    return res.json({ success: false, message: 'Email ou senha incorretos' });
  }
  
  // Guardar ID do usuário na sessão
  req.session.userId = user.id;
  
  res.json({ success: true });
});

// Endpoint para obter informações do usuário
app.get('/user-info', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  const user = users.find(user => user.id === req.session.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  
  // Retornar apenas as informações necessárias (não a senha)
  res.json({ id: user.id, name: user.name, email: user.email });
});

// Endpoint para carregar o progresso
app.get('/progresso', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  const progresso = userProgress[req.session.userId] || { cards: [], counters: { easy: 0, medium: 0, hard: 0 } };
  res.json(progresso);
});

// Endpoint para salvar o progresso
app.post('/progresso', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  userProgress[req.session.userId] = req.body;
  res.json({ success: true });
});

// Rota para logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
