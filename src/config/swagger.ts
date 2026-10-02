import swaggerJSDoc  from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API T13",
            version: "1.0.0",
            description: "API para o projeto T13",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Servidor local",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/routes/*.ts"], // Caminho para os arquivos de rotas e modelos
    };

    const swaggerSpec = swaggerJSDoc(options);

    export const setupSwagger = (app: Express) => {
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    };



    