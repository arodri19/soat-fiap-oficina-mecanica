const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { hashPassword, comparePassword } = require('../utils/hash');
const { JWT_SECRET } = require('../config');
const { validateEmail, validateString, validateEnum } = require('../utils/validation');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@oficina.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "MinhaSenha123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@oficina.com"
 *                     name:
 *                       type: string
 *                       example: "João Silva"
 *                     role:
 *                       type: string
 *                       enum: [ATTENDANT, MECHANIC]
 *                       example: "ATTENDANT"
 *       401:
 *         description: Credenciais inválidas
 */
async function login(req, res) {
  const email = validateEmail(req.body.email, 'email');
  const password = validateString(req.body.password, 'password', { required: true, minLength: 6 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  return res.json({ token, user: { email: user.email, name: user.name, role: user.role } });
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registro de novo usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@oficina.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "MinhaSenha123"
 *               role:
 *                 type: string
 *                 enum: [ATTENDANT, MECHANIC]
 *                 example: "ATTENDANT"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "João Silva"
 *                 email:
 *                   type: string
 *                   example: "joao@oficina.com"
 *                 role:
 *                   type: string
 *                   enum: [ATTENDANT, MECHANIC]
 *                   example: "ATTENDANT"
 *       409:
 *         description: Email já cadastrado
 */
async function register(req, res) {
  const name = validateString(req.body.name, 'name', { required: true });
  const email = validateEmail(req.body.email, 'email');
  const password = validateString(req.body.password, 'password', { required: true, minLength: 6 });
  const role = validateEnum(req.body.role, 'role', ['ATTENDANT', 'MECHANIC']);

  const hashedPassword = await hashPassword(password);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email já cadastrado.' });
    }
    throw error;
  }
}

module.exports = {
  login,
  register
};
