import {
    apiKeyClient,
    customSessionClient
} from "better-auth/client/plugins";

import { createAuthClient } from "better-auth/react";
import { auth } from ".";

const authClient = createAuthClient({
    plugins: [
        customSessionClient<typeof auth>(),
        apiKeyClient()
    ],
});

export { authClient };
