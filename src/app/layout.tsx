import "@/styles/style.scss";
import { ContextProvider } from "./contextProvider";
import SessionProvider from "./sessionProvider";
export const metadata = {
	title: "EVOLISS",
	description: "",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SessionProvider>
			<html lang="en">
				<head>
					<link
						rel="stylesheet"
						href="https://cdn.jsdelivr.net/npm/destyle.css@1.0.15/destyle.css"
					/>
				</head>
				<body>
					<div className="l-main">
						<ContextProvider>{children}</ContextProvider>
					</div>
				</body>
			</html>
		</SessionProvider>
	);
}
