import { useQuery } from '@tanstack/react-query'
import { useAccount, useNetwork } from 'wagmi'
import { chainConfig } from '~/lib/constants'
import { INftApiResponse, INftItem, ITransactionError } from '~/types'

interface IGetOwnedNfts {
	userAddress?: string
	alchemyNftUrl: string
	nftContractAddress?: string
}

export async function getOwnedNfts({
	userAddress,
	alchemyNftUrl,
	nftContractAddress
}: IGetOwnedNfts): Promise<Array<INftItem>> {
	try {
		if (!nftContractAddress || !userAddress) {
			return []
		}

		if (!alchemyNftUrl) {
			throw new Error('Error: Invalid arguments')
		}

		const data: INftApiResponse = await fetch(
			`${alchemyNftUrl}/?owner=${userAddress}&contractAddresses[]=${nftContractAddress}`
		).then((res) => res.json())

		return data?.ownedNfts.map((item) => ({
			tokenId: Number(item.id.tokenId),
			imgUrl: formatImageUrl(item.media[0].gateway) || ''
		}))
	} catch (error: any) {
		throw new Error(error.message || (error?.reason ?? "Couldn't get nfts of user"))
	}
}

export function useGetNftsList(nftContractAddress?: string) {
	const { address: userAddress } = useAccount()
	const { chain } = useNetwork()

	const { alchemyNftUrl } = chainConfig(chain?.id)

	return useQuery<Array<INftItem>, ITransactionError>(
		['nftsList', userAddress, chain?.id, nftContractAddress],
		() =>
			getOwnedNfts({
				userAddress,
				alchemyNftUrl,
				nftContractAddress
			}),
		{
			refetchInterval: 60 * 100
		}
	)
}

function formatImageUrl(url?: string) {
	if (url) {
		if (url.startsWith('https://api.tubbysea.com')) return url

		if (url.startsWith('https://ipfs.io/')) return `https://cloudflare-ipfs.com/` + url.split('https://ipfs.io/')[1]

		if (url.startsWith('ipfs://')) return `https://cloudflare-ipfs.com/` + url.split('ipfs://')[1]

		return url
	}
}
