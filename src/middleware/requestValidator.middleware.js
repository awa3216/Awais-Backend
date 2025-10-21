import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';

import { validationSchemas } from '../validations/index.js';
import { pathToRegexp } from 'path-to-regexp';

const requestValidator = (req, res, next) => {
    try {
        const { method, originalUrl, body } = req;
        if (originalUrl.startsWith('/uploads') || originalUrl === '/favicon.ico') {
            return next();
        }
        // Extract route path without query parameters
        const fullURL = originalUrl.split('?')[0];
        console.log(`🔍 Validating request: ${method} ${fullURL}`);

        // Match the route using path-to-regexp
        const matchedRoute = Object.keys(validationSchemas).find((route) => {
            try {
                const { regexp } = pathToRegexp(route);
                const isMatch = regexp.test(fullURL);
                if (isMatch) {
                    console.log(`✅ Matched route: ${route}`);
                }
                return isMatch;
            } catch (err) {
                console.error(
                    `❌ Failed to compile route pattern "${route}": ${err.message}`
                );
                return false;
            }
        });

        // No matching route in validationSchemas
        if (!matchedRoute) {
            console.warn(`⚠️ No validation schema route matched for: ${fullURL}`);
            return next(
                new ApiError(
                    errorConstants.GENERAL.VALIDATION_ERROR || 'Route not validated',
                    400
                )
            );
        }

        const routeSchemas = validationSchemas[matchedRoute];
        if (!routeSchemas) {
            console.warn(
                `⚠️ Route "${matchedRoute}" found but no method-based schema exists`
            );
            return next(
                new ApiError(
                    errorConstants.GENERAL.VALIDATION_ERROR ||
                    'No schema defined for this route',
                    400
                )
            );
        }

        const schema = routeSchemas[method];
        if (schema === null) {
            console.log(
                `ℹ️ Validation skipped (null schema) for ${method} ${matchedRoute}`
            );
            return next();
        }

        if (!schema) {
            console.log(
                `ℹ️ No schema defined for HTTP method ${method} in route "${matchedRoute}"`
            );
            return next();
        }

        if (req.is('multipart/form-data')) {
            console.log(`📁 Skipping validation for multipart/form-data`);
            return next();
        }

        const { error } = schema.validate(body, { abortEarly: false });

        if (error) {
            console.error(
                `❌ Joi validation error in route ${method} ${matchedRoute}:`
            );
            error.details.forEach((detail) => {
                console.error(`  - ${detail.path.join('.')}: ${detail.message}`);
            });

            return next(new ApiError(error.details[0].message, 400));
        }

        console.log(
            `✅ Request body passed validation for ${method} ${matchedRoute}`
        );
        next();
    } catch (err) {
        console.error(`🔥 Uncaught validation middleware error: ${err.message}`);
        return next(
            new ApiError(errorConstants.GENERAL.VALIDATION_ERROR || err.message, 403)
        );
    }
};

export default requestValidator;
