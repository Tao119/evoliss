import { withAuth } from 'next-auth/middleware'


export default withAuth({
    pages: {
        signIn: "/sign-in",
    },
});

export const config = {
    matcher: ['/((?!sign-up|api|sign-in|test).*)'],
};
