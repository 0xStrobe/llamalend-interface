import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'
import { useQuery } from '@tanstack/react-query'
import { IContractReadConfig, ITransactionError } from '~/types'
import { chainConfig } from '~/lib/constants'
import { erc721ABI, useContractRead, useNetwork } from 'wagmi'
import { fetchQuote } from './useGetQuote'

interface IGetPoolDataArgs {
	contractArgs: IContractReadConfig | null
	chainId?: number | null
	isTestnet: boolean
	quoteApi: string
}

export interface IPoolData {
	name: string
	symbol: string
	maxLoanLength: number
	currentAnnualInterest: number
	maxInterestPerEthPerSecond: number
	nftContract: string
	nftName: string
}

export async function getPool({ contractArgs, chainId, quoteApi, isTestnet }: IGetPoolDataArgs) {
	try {
		if (!chainId || !contractArgs) {
			return null
		}

		const { address, abi, provider } = contractArgs

		if (!provider || !quoteApi) {
			throw new Error('Invalid arguments')
		}

		const quote = await fetchQuote({ api: quoteApi, isTestnet, poolAddress: address })

		const contract = new ethers.Contract(address, abi, provider)

		const [
			name,
			symbol,
			maxLoanLength,
			currentAnnualInterest,
			minimumInterest,
			maxInterestPerEthPerSecond,
			nftContract
		]: Array<string> = await Promise.all([
			contract.name(),
			contract.symbol(),
			contract.maxLoanLength(),
			contract.currentAnnualInterest(new BigNumber(quote?.price ?? 0).multipliedBy(1e18).toFixed(0)),
			contract.minimumInterest(),
			contract.maxInterestPerEthPerSecond(),
			contract.nftContract()
		])

		const nftContractInterface = new ethers.Contract(nftContract, erc721ABI, provider)

		const nftName = await nftContractInterface.name()

		return {
			name,
			symbol,
			maxLoanLength: Number(maxLoanLength),
			currentAnnualInterest: Number(currentAnnualInterest),
			maxInterestPerEthPerSecond: Number(maxInterestPerEthPerSecond) + Number(minimumInterest),
			nftContract,
			nftName
		}
	} catch (error: any) {
		throw new Error(error.message || (error?.reason ?? "Couldn't get pool data"))
	}
}

export function useGetPoolData({ chainId, address }: { chainId?: number | null; address?: string }) {
	const config = chainConfig(chainId)

	const contractArgs = address
		? {
				address,
				abi: config.poolABI,
				provider: config.chainProvider
		  }
		: null

	return useQuery<IPoolData | null, ITransactionError>(
		['pool', chainId, address],
		() => getPool({ contractArgs, chainId, quoteApi: config.quoteApi, isTestnet: config.isTestnet }),
		{
			refetchInterval: 30_000
		}
	)
}

export function useGetPoolInterestInCart({
	poolAddress,
	totalReceived
}: {
	poolAddress: string
	totalReceived: number
}) {
	const { chain } = useNetwork()
	const config = chainConfig(chain?.id)

	return useContractRead({
		addressOrName: poolAddress,
		contractInterface: config.poolABI,
		functionName: 'currentAnnualInterest',
		args: new BigNumber(totalReceived).multipliedBy(1e18).toFixed(0)
	})
}
