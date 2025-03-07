import * as React from 'react'
import Image from 'next/future/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { cx } from 'cva'
import AppLink from './AppLink'
import Menu from './Menu'
import { CartLink } from './CartLink'

interface ILayoutProps {
	children?: React.ReactNode
	style?: React.CSSProperties
	className?: string
}

export default function Layout({ children, className, ...props }: ILayoutProps) {
	return (
		<>
			<header className="mx-auto flex w-full max-w-8xl flex-col flex-wrap gap-4 p-3 sm:flex-row sm:items-center sm:justify-between">
				<nav className="mr-auto flex w-full items-center gap-3 rounded-xl bg-white p-1 text-base font-semibold text-black sm:w-auto">
					<Image src="/assets/gib.png" alt="llamalend" height={24} width={24} priority />
					<AppLink name="Borrow" path="/" />
					<AppLink name="Repay" path="/repay" />
				</nav>

				<span className="flex flex-wrap items-center gap-3 [&>*:first-child]:!mr-auto">
					<ConnectButton />
					<CartLink />
					<Menu />
				</span>
			</header>

			<React.Suspense fallback={null}>
				<main className={cx('mx-auto flex min-h-full w-full max-w-8xl flex-1 flex-col p-3', className)} {...props}>
					{children}
				</main>
			</React.Suspense>
		</>
	)
}
