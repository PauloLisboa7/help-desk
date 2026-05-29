import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// Middleware de Autenticação JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de autenticação não encontrado',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'seu_secret_key', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware para verificar perfil de usuário
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.perfil)) {
      return res.status(403).json({ 
        error: 'Permissão insuficiente',
        code: 'FORBIDDEN',
        required_role: allowedRoles,
        user_role: req.user.perfil
      });
    }

    next();
  };
};

// Gerar Token JWT
export const generateToken = (usuario) => {
  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      nome: usuario.nome
    },
    process.env.JWT_SECRET || 'seu_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  return token;
};

// Gerar Refresh Token
export const generateRefreshToken = (usuario) => {
  const refreshToken = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email
    },
    process.env.JWT_REFRESH_SECRET || 'seu_refresh_secret_key',
    { expiresIn: '30d' }
  );

  return refreshToken;
};

// Hash de Senha
export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

// Comparar Senha
export const comparePassword = async (password, hash) => {
  return bcryptjs.compare(password, hash);
};

// Middleware de Validação
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Erro de validação',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Middleware de Tratamento de Erros
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
