import {
  RequiredParam,
  requiredParamInvariant,
} from "../../../core/query-utils/required-param";
import { useSDKChainId } from "../../providers/base";
import {
  AcceptDirectOffer,
  BuyNowParams,
  ExecuteAuctionSale,
  MakeBidParams,
  MakeOfferParams,
} from "../../types";
import {
  cacheKeys,
  invalidateContractAndBalances,
} from "../../utils/cache-keys";
import { useQueryWithNetwork } from "../query-utils/useQueryWithNetwork";
import { useAddress } from "../wallet";
import { useContractEvents } from "./contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AuctionListing,
  DirectListing,
  MarketplaceFilter,
  NewAuctionListing,
  NewDirectListing,
} from "@thirdweb-dev/sdk";
import { ListingType } from "@thirdweb-dev/sdk";
import { Marketplace } from "@thirdweb-dev/sdk/dist/declarations/src/evm/contracts/prebuilt-implementations/marketplace";
import { BigNumberish } from "ethers";
import invariant from "tiny-invariant";

/** **********************/
/**     READ  HOOKS     **/
/** **********************/

/**
 * Use this to get a specific listing from the marketplace.
 *
 * @example
 * ```javascript
 * const { data: listing, isLoading, error } = useListing(<YourMarketplaceContractInstance>, <listingId>);
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @param listingId - the listing id to check
 * @returns a response object that includes an array of listings
 * @beta
 */
export function useListing(
  contract: RequiredParam<Marketplace>,
  listingId: RequiredParam<BigNumberish>,
) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.getListing(contractAddress, listingId),
    () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      requiredParamInvariant(listingId, "No listing id provided");
      return contract.getListing(listingId);
    },
    {
      enabled: !!contract,
      keepPreviousData: true,
    },
  );
}

/**
 * Use this to get a list all listings from your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: listings, isLoading, error } = useListings(<YourMarketplaceContractInstance>, { start: 0, count: 100 });
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @param filter - filter to pass to the query for the sake of pagination & filtering
 * @returns a response object that includes an array of listings
 * @beta
 */
export function useListings(
  contract: RequiredParam<Marketplace>,
  filter?: MarketplaceFilter,
) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.getAllListings(contractAddress, filter),
    () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      return contract.getAllListings(filter);
    },
    {
      enabled: !!contract,
      keepPreviousData: true,
    },
  );
}

/**
 * Use this to get a count of all listings on your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: listings, isLoading, error } = useListings(<YourMarketplaceContractInstance>);
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @returns a response object that includes an array of listings
 * @beta
 */
export function useListingsCount(contract: RequiredParam<Marketplace>) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.getTotalCount(contractAddress),
    () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      return contract.getTotalCount();
    },
    {
      enabled: !!contract,
    },
  );
}

/**
 * Use this to get a list active listings from your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: listings, isLoading, error } = useActiveListings(<YourMarketplaceContractInstance>, { seller: "0x...", tokenContract: "0x...", tokenId: 1, start: 0, count: 100 });
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @param filter - filter to pass to the query for the sake of pagination & filtering
 * @returns a response object that includes an array of listings
 * @beta
 */
export function useActiveListings(
  contract: RequiredParam<Marketplace>,
  filter?: MarketplaceFilter,
) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.getActiveListings(contractAddress, filter),
    () => {
      requiredParamInvariant(contract, "No Contract instance provided");

      return contract.getActiveListings(filter);
    },
    {
      enabled: !!contract,
      keepPreviousData: true,
    },
  );
}

/**
 * Use this to get a the winning bid for an auction listing from your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: winningBid, isLoading, error } = useWinningBid(<YourMarketplaceContractInstance>, <listingId>);
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @param listingId - the listing id to check
 * @returns a response object that includes the {@link Offer} that is winning the auction
 * @beta
 */
export function useWinningBid(
  contract: RequiredParam<Marketplace>,
  listingId: RequiredParam<BigNumberish>,
) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.auction.getWinningBid(
      contractAddress,
      listingId,
    ),
    () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      requiredParamInvariant(listingId, "No listing id provided");
      return contract.auction.getWinningBid(listingId);
    },
    {
      enabled: !!contract && listingId !== undefined,
    },
  );
}

/**
 * Use this to get the winner of an auction listing from your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: auctionWinner, isLoading, error } = useAuctionWinner(<YourMarketplaceContractInstance>, <listingId>);
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @param listingId - the listing id to check
 * @returns a response object that includes the address of the winner of the auction or undefined if there is no winner yet
 * @beta
 */
export function useAuctionWinner(
  contract: RequiredParam<Marketplace>,
  listingId: RequiredParam<BigNumberish>,
) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.auction.getWinner(
      contractAddress,
      listingId,
    ),
    async () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      requiredParamInvariant(listingId, "No listing id provided");
      let winner: string | undefined;
      try {
        winner = await contract.auction.getWinner(listingId);
      } catch (err) {
        if (!(err as Error)?.message?.includes("Could not find auction")) {
          throw err;
        }
      }
      return winner;
    },
    {
      enabled: !!contract && listingId !== undefined,
    },
  );
}

/**
 * Use this to get the buffer in basis points between offers from your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: auctionWinner, isLoading, error } = useBidBuffer(<YourMarketplaceContractInstance>);
 * ```
 *
 * @param contract - an instance of a marketplace contract

 * @returns a response object that includes an array of listings
 * @beta
 */
export function useBidBuffer(contract: RequiredParam<Marketplace>) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.getBidBufferBps(contractAddress),
    () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      return contract.getBidBufferBps();
    },
    {
      enabled: !!contract,
    },
  );
}

/**
 * Use this to get the minimum next bid for the auction listing from your marketplace contract.
 *
 * @example
 * ```javascript
 * const { data: minimumNextBid, isLoading, error } = useMinimumNextBid(<YourMarketplaceContractInstance>, <listingId>);
 * ```
 *
 * @param contract - an instance of a marketplace contract
 * @param listingId - the listing id to check
 * @returns a response object that includes the minimum next bid for the auction listing
 * @beta
 */
export function useMinimumNextBid(
  contract: RequiredParam<Marketplace>,
  listingId: RequiredParam<BigNumberish>,
) {
  const contractAddress = contract?.getAddress();
  return useQueryWithNetwork(
    cacheKeys.contract.marketplace.auction.getWinner(
      contractAddress,
      listingId,
    ),
    async () => {
      requiredParamInvariant(contract, "No Contract instance provided");
      requiredParamInvariant(listingId, "No listing id provided");
      return await contract.auction.getMinimumNextBid(listingId);
    },
    {
      enabled: !!contract && listingId !== undefined,
    },
  );
}

/** **********************/
/**     WRITE HOOKS     **/
/** **********************/

/**
 * Use this to create a new Direct Listing on your marketplace contract.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: createDirectListing,
 *     isLoading,
 *     error,
 *   } = useCreateDirectListing(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to create direct listing", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => createDirectListing(directListingData)}
 *     >
 *       Create Direct Listing!
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to create a new direct listing
 * @beta
 */
export function useCreateDirectListing(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: NewDirectListing) => {
      invariant(walletAddress, "no wallet connected, cannot create listing");
      requiredParamInvariant(contract, "No Contract instance provided");
      invariant(
        contract.direct.createListing,
        "contract does not support direct.createListing",
      );
      return await contract.direct.createListing(data);
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Use this to create a new Auction Listing on your marketplace contract.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: createAuctionListing,
 *     isLoading,
 *     error,
 *   } = useCreateAuctionListing(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to create auction listing", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => createAuctionListing(auctionListingData)}
 *     >
 *       Create Auction Listing!
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to create a new auction listing
 * @beta
 */
export function useCreateAuctionListing(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: NewAuctionListing) => {
      invariant(walletAddress, "no wallet connected, cannot create listing");
      requiredParamInvariant(contract, "No Contract instance provided");
      invariant(
        contract.direct.createListing,
        "contract does not support auction.createListing",
      );
      return await contract.auction.createListing(data);
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Use this to cancel a listing on your marketplace contract.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: cancelListing,
 *     isLoading,
 *     error,
 *   } = useCancelListing(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to cancel auction listing", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => cancelListing()}
 *     >
 *       Create Auction Listing!
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to create a new auction listing
 * @beta
 */
export function useCancelListing(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  return useMutation(
    async (data: Pick<AuctionListing | DirectListing, "type" | "id">) => {
      if (data.type === ListingType.Auction) {
        return await contract?.auction.cancelListing(data.id);
      } else {
        return await contract?.direct.cancelListing(data.id);
      }
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Use this to place a bid on an auction listing from your marketplace contract.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: makeBid,
 *     isLoading,
 *     error,
 *   } = useMakeBid(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to make a bid", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => makeBid({ listingId: 1, bid: 2 })}
 *     >
 *       Bid!
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to make a bid on an auction listing
 * @beta
 */
export function useMakeBid(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: MakeBidParams) => {
      invariant(walletAddress, "no wallet connected, cannot make bid");
      requiredParamInvariant(contract, "No Contract instance provided");
      invariant(
        contract.auction.makeBid,
        "contract does not support auction.makeBid",
      );
      return await contract.auction.makeBid(data.listingId, data.bid);
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Use this to make an offer on direct or auction listing from your marketplace contract.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: makeOffer,
 *     isLoading,
 *     error,
 *   } = useMakeOffer(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to make a bid", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => makeOffer({ listingId: 1, pricePerToken: 0.5, quantity: 1 })}
 *     >
 *       Bid!
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to make a bid on an auction listing
 * @beta
 */
export function useMakeOffer(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: MakeOfferParams) => {
      invariant(walletAddress, "no wallet connected, cannot make bid");
      requiredParamInvariant(contract, "No Contract instance provided");
      return await contract.makeOffer(
        data.listingId,
        data.pricePerToken,
        data.quantity,
      );
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Accept an offer on a direct listing from an offeror, will accept the latest offer by the given offeror.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: acceptOffer,
 *     isLoading,
 *     error,
 *   } = useAcceptDirectListingOffer(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to accept offer", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => acceptOffer({ listingId: 1, addressOfOfferor: "0x..." })}
 *     >
 *       Accept offer
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to accept an offer on a direct listing
 * @beta
 */
export function useAcceptDirectListingOffer(
  contract: RequiredParam<Marketplace>,
) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: AcceptDirectOffer) => {
      invariant(walletAddress, "no wallet connected, cannot make bid");
      requiredParamInvariant(contract?.direct, "No Direct instance provided");
      return await contract.direct.acceptOffer(
        data.listingId,
        data.addressOfOfferor,
      );
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Execute an auction sale. Can only be executed once the auction has ended and the auction has a winning bid.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: executeAuctionSale,
 *     isLoading,
 *     error,
 *   } = useExecuteAuctionSale(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to execute sale", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => executeAuctionSale({ listingId: 1 })}
 *     >
 *       Execute sale
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to accept an offer on a direct listing
 * @beta
 */
export function useExecuteAuctionSale(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: ExecuteAuctionSale) => {
      invariant(walletAddress, "no wallet connected, cannot make bid");
      requiredParamInvariant(
        contract?.auction,
        "No Auction marketplace instance provided",
      );
      return await contract.auction.executeSale(data.listingId);
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}

/**
 * Get all the offers for a listing
 *
 * @remarks Fetch all the offers for a specified direct or auction listing.
 * @example
 * ```javascript
 * const { data: offers, isLoading, error } = useOffers(<YourMarketplaceContractInstance>, <listingId>);
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @param listingId - the id of the listing to fetch offers for
 * @beta
 */
export function useOffers(
  contract: RequiredParam<Marketplace>,
  listingId: RequiredParam<BigNumberish>,
) {
  const result = useContractEvents(contract, "NewOffer");
  return {
    ...result,
    data: result.data
      ?.filter((ev) => ev.data.listingId.eq(listingId))
      ?.map((ev) => ev.data),
  };
}

/**
 * Use this to buy out an auction listing from your marketplace contract.
 *
 * @example
 * ```jsx
 * const Component = () => {
 *   const {
 *     mutate: buyNow,
 *     isLoading,
 *     error,
 *   } = useBuyNow(">>YourMarketplaceContractInstance<<");
 *
 *   if (error) {
 *     console.error("failed to buyout listing", error);
 *   }
 *
 *   return (
 *     <button
 *       disabled={isLoading}
 *       onClick={() => buyNow({listingId: 1, type: ListingType.Auction})}
 *     >
 *       Buy listing!
 *     </button>
 *   );
 * };
 * ```
 *
 * @param contract - an instance of a Marketplace contract
 * @returns a mutation object that can be used to buy out an auction listing
 * @beta
 */
export function useBuyNow(contract: RequiredParam<Marketplace>) {
  const activeChainId = useSDKChainId();
  const contractAddress = contract?.getAddress();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  return useMutation(
    async (data: BuyNowParams) => {
      invariant(walletAddress, "no wallet connected, cannot make bid");
      requiredParamInvariant(contract, "No Contract instance provided");
      if (data.type === ListingType.Direct) {
        invariant(
          contract.direct.buyoutListing,
          "contract does not support direct.buyoutListing",
        );

        return await contract.direct.buyoutListing(
          data.id,
          data.buyAmount,
          data.buyForWallet,
        );
      }
      invariant(
        contract.auction.buyoutListing,
        "contract does not support auction.buyoutListing",
      );
      return await contract.auction.buyoutListing(data.id);
    },
    {
      onSettled: () =>
        invalidateContractAndBalances(
          queryClient,
          contractAddress,
          activeChainId,
        ),
    },
  );
}
