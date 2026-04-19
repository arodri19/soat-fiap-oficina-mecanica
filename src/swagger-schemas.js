/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           example: "joao@email.com"
 *         role:
 *           type: string
 *           enum: [ATTENDANT, MECHANIC]
 *           example: "ATTENDANT"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *
 *     ClientPF:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "João Silva"
 *         cpf:
 *           type: string
 *           example: "12345678901"
 *         email:
 *           type: string
 *           format: email
 *           example: "joao@email.com"
 *         address:
 *           type: string
 *           example: "Rua das Flores"
 *         number:
 *           type: string
 *           example: "123"
 *         state:
 *           type: string
 *           example: "SP"
 *         cep:
 *           type: string
 *           example: "01234567"
 *         vehicles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Vehicle'
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderService'
 *
 *     ClientPJ:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Empresa XYZ Ltda"
 *         fantasyName:
 *           type: string
 *           example: "Empresa XYZ"
 *         companyName:
 *           type: string
 *           example: "Empresa XYZ Ltda"
 *         cnpj:
 *           type: string
 *           example: "12345678000123"
 *         email:
 *           type: string
 *           format: email
 *           example: "contato@empresa.com"
 *         address:
 *           type: string
 *           example: "Av. Paulista"
 *         number:
 *           type: string
 *           example: "1000"
 *         state:
 *           type: string
 *           example: "SP"
 *         cep:
 *           type: string
 *           example: "01310100"
 *         legalResponsible:
 *           type: string
 *           example: "João Silva"
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderService'
 *
 *     Vehicle:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         plate:
 *           type: string
 *           example: "ABC1234"
 *         model:
 *           type: string
 *           example: "Civic"
 *         year:
 *           type: integer
 *           example: 2020
 *         color:
 *           type: string
 *           example: "Preto"
 *         clientPFId:
 *           type: integer
 *           example: 1
 *         clientPF:
 *           $ref: '#/components/schemas/ClientPF'
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderService'
 *
 *     Service:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Troca de óleo"
 *         slaMinutes:
 *           type: integer
 *           example: 60
 *         orderServices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderServiceService'
 *
 *     Part:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Filtro de óleo"
 *         type:
 *           type: string
 *           example: "Filtro"
 *         model:
 *           type: string
 *           example: "Honda Civic"
 *         color:
 *           type: string
 *           example: "Preto"
 *         quantity:
 *           type: integer
 *           example: 10
 *         orderServices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderServicePart'
 *
 *     OrderService:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         externalId:
 *           type: string
 *           example: "uuid-string"
 *         status:
 *           type: string
 *           enum: [RECEBIDA, EM_DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, FINALIZADA, ENTREGUE]
 *           example: "RECEBIDA"
 *         description:
 *           type: string
 *           example: "Troca de óleo e filtros"
 *         mechanicName:
 *           type: string
 *           example: "João Silva"
 *         budgetValue:
 *           type: number
 *           format: float
 *           example: 150.0
 *         startAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         endAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         clientPFId:
 *           type: integer
 *           example: 1
 *         clientPF:
 *           $ref: '#/components/schemas/ClientPF'
 *         clientPJId:
 *           type: integer
 *           example: 1
 *         clientPJ:
 *           $ref: '#/components/schemas/ClientPJ'
 *         vehicleId:
 *           type: integer
 *           example: 1
 *         vehicle:
 *           $ref: '#/components/schemas/Vehicle'
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderServiceService'
 *         parts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderServicePart'
 *
 *     OrderServiceService:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         orderServiceId:
 *           type: integer
 *           example: 1
 *         serviceId:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         orderService:
 *           $ref: '#/components/schemas/OrderService'
 *         service:
 *           $ref: '#/components/schemas/Service'
 *
 *     OrderServicePart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         orderServiceId:
 *           type: integer
 *           example: 1
 *         partId:
 *           type: integer
 *           example: 1
 *         quantity:
 *           type: integer
 *           example: 2
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         orderService:
 *           $ref: '#/components/schemas/OrderService'
 *         part:
 *           $ref: '#/components/schemas/Part'
 *
 *     Budget:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         totalBudget:
 *           type: number
 *           format: float
 *           example: 550.0
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderService'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:00:00Z"
 */