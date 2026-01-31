
export interface PossibleTypesResultData {
    possibleTypes: {
        [key: string]: string[]
    }
}
const result: PossibleTypesResultData = {
    "possibleTypes": {
        "AcceptSocialFollowersResult": [
            "AcceptSocialFollowersSuccess",
            "InvalidSocialAcceptFollowRequestError",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "AddGuestBirthdayResult": [
            "AddGuestBirthdaySuccess",
            "BirthdayAlreadyExistsError",
            "InvalidBirthdayError",
            "UnexpectedError"
        ],
        "AddGuestIdentityResult": [
            "AddGuestIdentitySuccess",
            "GuestIdentityAlreadyExistsForCurrentGuestError",
            "InvalidEmailError",
            "ProfileLockedForDeletionError",
            "UnexpectedError"
        ],
        "AddGuestReactionToPostResponse": [
            "AddGuestReactionToPostSuccess",
            "UnexpectedError"
        ],
        "AdminAddAwardTypeToSeasonResult": [
            "AdminAddAwardTypeToSeasonSuccess",
            "UnexpectedError"
        ],
        "AdminCreateAwardSeasonResult": [
            "AdminCreateAwardSeasonSuccess",
            "UnexpectedError"
        ],
        "AdminCreatePlaceVideoPostResult": [
            "AdminCreatePlaceVideoPostSuccess",
            "UnexpectedError"
        ],
        "AdminDeleteAwardSeasonResult": [
            "AdminDeleteAwardSeasonSuccess",
            "UnexpectedError"
        ],
        "AdminDeletePlaceVideoPostResult": [
            "AdminDeletePlaceVideoPostSuccess",
            "UnexpectedError"
        ],
        "AdminEditAwardSeasonResult": [
            "AdminEditAwardSeasonSuccess",
            "UnexpectedError"
        ],
        "AdminEditAwardTypeResult": [
            "AdminEditAwardTypeSuccess",
            "UnexpectedError"
        ],
        "AdminGetAwardTypesBySeasonIdResult": [
            "AdminGetAwardTypesBySeasonIdSuccess",
            "UnexpectedError"
        ],
        "AdminRemoveAwardTypeFromSeasonResult": [
            "AdminRemoveAwardTypeFromSeasonSuccess",
            "UnexpectedError"
        ],
        "ApplyBoostFundedOfferResponseOrError": [
            "ApplyBoostFundedOfferError",
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse"
        ],
        "ApplyCodeToGuestCurrencyAccountResult": [
            "ApplyCodeToGuestCurrencyAccountError",
            "ApplyCodeToGuestCurrencyAccountSuccess"
        ],
        "ApplyPromoCodeResponseOrError": [
            "ApplyPromoCodeError",
            "ApplyPromoCodeResponse"
        ],
        "ApplyPromoCodeResponseOrErrorV2": [
            "ApplyPromoCodeError",
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse"
        ],
        "ApplyToastFundedOfferResponseOrError": [
            "ApplyToastFundedOfferError",
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse"
        ],
        "ArchiveGuestCommentResult": [
            "ArchiveGuestCommentSuccess",
            "UnexpectedError"
        ],
        "ArchiveGuestPostResult": [
            "ArchiveGuestPostSuccess",
            "UnexpectedError"
        ],
        "ArchiveGuestReviewResult": [
            "ArchiveGuestReviewSuccess",
            "UnexpectedError"
        ],
        "ArchiveSocialUserProfilePhotoResult": [
            "ArchiveSocialUserProfilePhotoSuccess",
            "UnexpectedError"
        ],
        "AuthorizePaymentResponseOrError": [
            "AuthorizePaymentError",
            "AuthorizePaymentResponse"
        ],
        "BackfillGuestOrderHistoryByCardFingerprintsResult": [
            "BackfillGuestOrderHistoryByCardFingerprintsAttempts",
            "BackfillGuestOrderHistoryTooManyCardFingerprintsError",
            "UnexpectedError"
        ],
        "BanSocialUserResult": [
            "BanSocialUserSuccess",
            "SocialUserBannedError",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "BaseBoostToastFundedOffer": [
            "BoostDiscountOffMinOffer",
            "BoostFreeDeliveryOffer"
        ],
        "BaseOfferTargeting": [
            "LocationTargeting",
            "NoTargeting",
            "RestaurantTargeting"
        ],
        "BaseRankedBoostFundedOffer": [
            "RankedBoostDiscountOffMinOffer",
            "RankedBoostFreeDeliveryOffer"
        ],
        "BaseRankedToastFundedOffer": [
            "RankedDiscountOffMinOffer",
            "RankedFreeDeliveryOffer"
        ],
        "BaseToastFundedOffer": [
            "DiscountOffMinOffer",
            "FreeDeliveryOffer"
        ],
        "BookingCancelReservationResponse": [
            "BookingCancelReservationResponseSuccess",
            "BookingInternalError",
            "BookingNotFound",
            "BookingRestaurantNotFound",
            "BookingUnableToRefundDeposit",
            "BookingUnauthorizedGuestProfile",
            "BookingUnsupportedTransition"
        ],
        "BookingCreateReservationResponse": [
            "BookingCreateReservationResponseSuccess",
            "BookingDepositAmountChanged",
            "BookingDepositRuleNotMatching",
            "BookingInvalidEmail",
            "BookingInvalidPartySize",
            "BookingInvalidPhoneNumber",
            "BookingNoTableAvailable",
            "BookingOverlappingBooking",
            "BookingRequiresDepositData",
            "BookingRestaurantIsClosed",
            "BookingRestaurantNotFound",
            "BookingServiceAreaNotFound",
            "BookingUnableToCreateDepositOrder",
            "BookingUnableToCreateGuest"
        ],
        "BookingCreateSetupIntentResponse": [
            "BookingCreateSetupIntentResponseSuccess",
            "BookingInternalError",
            "BookingNotFound",
            "BookingRestaurantNotFound",
            "BookingUnauthorizedGuestProfile"
        ],
        "BookingCreateWaitlistResponse": [
            "BookingCreateReservationResponseSuccess",
            "BookingInvalidEmail",
            "BookingInvalidPartySize",
            "BookingInvalidPhoneNumber",
            "BookingOverlappingBooking",
            "BookingRestaurantIsClosed",
            "BookingRestaurantNotFound",
            "BookingServiceAreaNotFound",
            "BookingUnableToCreateGuest"
        ],
        "BookingDepositStrategy": [
            "BookingDepositStrategyByBooking",
            "BookingDepositStrategyByPartySize"
        ],
        "BookingError": [
            "BookingBulkAvailabilitiesRestaurantLimitExceeded",
            "BookingDepositAmountChanged",
            "BookingDepositRuleNotMatching",
            "BookingGuestNotFound",
            "BookingInternalError",
            "BookingInvalidBooking",
            "BookingInvalidEmail",
            "BookingInvalidPartySize",
            "BookingInvalidPhoneNumber",
            "BookingNoTableAvailable",
            "BookingNotFound",
            "BookingOverlappingBooking",
            "BookingPaymentNotFound",
            "BookingRequiresDepositData",
            "BookingRestaurantIsClosed",
            "BookingRestaurantLimitExceeded",
            "BookingRestaurantNotFound",
            "BookingServiceAreaNotFound",
            "BookingUnableToCreateDepositOrder",
            "BookingUnableToCreateGuest",
            "BookingUnableToFetchGuests",
            "BookingUnableToRefundDeposit",
            "BookingUnableToSendSMS",
            "BookingUnableToUpdateReservation",
            "BookingUnauthorizedGuestProfile",
            "BookingUnsupportedTransition"
        ],
        "BookingGuestBookingsResponse": [
            "BookingGuestBookingsResponseSuccess",
            "BookingInternalError"
        ],
        "BookingPublicAvailabilitiesResponse": [
            "BookingNotFound",
            "BookingPublicAvailabilitiesResponseSuccess",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicBookingOrderPriceSummaryResponse": [
            "BookingInternalError",
            "BookingNotFound",
            "BookingPublicBookingOrderPriceSummaryResponseSuccess",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicBookingResponse": [
            "BookingInternalError",
            "BookingNotFound",
            "BookingPublicBookingResponseSuccess",
            "BookingRestaurantNotFound",
            "BookingUnableToFetchGuests"
        ],
        "BookingPublicBulkAvailabilitiesErrorResponse": [
            "BookingNotFound",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicBulkAvailabilitiesResponse": [
            "BookingBulkAvailabilitiesRestaurantLimitExceeded",
            "BookingPublicBulkAvailabilitiesError",
            "BookingPublicBulkAvailabilitiesResponseSuccess"
        ],
        "BookingPublicBulkWaitlistEstimatesResponse": [
            "BookingPublicBulkWaitlistEstimatesSuccess",
            "BookingRestaurantLimitExceeded"
        ],
        "BookingPublicBulkWaitlistInfoResponse": [
            "BookingPublicBulkWaitlistInfoSuccess",
            "BookingRestaurantLimitExceeded"
        ],
        "BookingPublicExperienceResponse": [
            "BookingInternalError",
            "BookingNotFound",
            "BookingPublicExperienceResponseSuccess",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicExperiencesResponse": [
            "BookingInternalError",
            "BookingPublicExperiencesResponseSuccess",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicPaymentAddOnResponse": [
            "BookingInternalError",
            "BookingPaymentNotFound",
            "BookingPublicPaymentAddOnResponseSuccess",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicRestaurantResponse": [
            "BookingInternalError",
            "BookingPublicRestaurantResponseSuccess",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicSpiBearerTokenResponse": [
            "BookingInternalError",
            "BookingPublicSpiBearerTokenResponseSuccess"
        ],
        "BookingPublicWaitlistEstimateResponse": [
            "BookingInternalError",
            "BookingInvalidBooking",
            "BookingNotFound",
            "BookingPublicWaitlistEstimateResponseSuccess",
            "BookingRestaurantIsClosed",
            "BookingRestaurantNotFound"
        ],
        "BookingPublicWaitlistInfoResponse": [
            "BookingPublicWaitlistInfoSuccess",
            "BookingRestaurantIsClosed",
            "BookingRestaurantNotFound"
        ],
        "BookingStoreMandateResponse": [
            "BookingInternalError",
            "BookingMandateNotFound",
            "BookingNotFound",
            "BookingRestaurantNotFound",
            "BookingStoreMandateResponseSuccess"
        ],
        "BookingToastPayEnabledResponse": [
            "BookingInternalError",
            "BookingNotFound",
            "BookingRestaurantNotFound",
            "BookingToastPayEnabledResponseSuccess"
        ],
        "BookingToastPaySelectedTipResponse": [
            "BookingInternalError",
            "BookingNotFound",
            "BookingRestaurantNotFound",
            "BookingToastPaySelectedTipResponseSuccess"
        ],
        "BookingUpdateGuestEmailResponse": [
            "BookingGuestNotFound",
            "BookingInternalError",
            "BookingInvalidEmail",
            "BookingNotFound",
            "BookingRestaurantNotFound",
            "BookingUpdateGuestEmailResponseSuccess"
        ],
        "BookingUpdateReservationResponse": [
            "BookingInvalidEmail",
            "BookingInvalidPhoneNumber",
            "BookingNotFound",
            "BookingOverlappingBooking",
            "BookingRestaurantIsClosed",
            "BookingUnableToCreateGuest",
            "BookingUnableToSendSMS",
            "BookingUnableToUpdateReservation",
            "BookingUnauthorizedGuestProfile",
            "BookingUpdateReservationResponseSuccess"
        ],
        "BookingUpdateWaitlistResponse": [
            "BookingNotFound",
            "BookingRestaurantIsClosed",
            "BookingRestaurantNotFound",
            "BookingUnableToSendSMS",
            "BookingUpdateWaitlistResponseSuccess"
        ],
        "BoostFundedOffer": [
            "BoostDiscountOffMinOffer",
            "BoostFreeDeliveryOffer"
        ],
        "CON_EnrollInIndustryPassResult": [
            "CON_EnrollInIndustryPassError",
            "CON_EnrollInIndustryPassSuccess"
        ],
        "CON_IndustryPassStatus": [
            "CON_IndustryPassEligible",
            "CON_IndustryPassEnrolled",
            "CON_IndustryPassIneligible"
        ],
        "CON_ToastCashbackRestaurantsResult": [
            "CON_ToastCashbackInvalidInputError",
            "CON_ToastCashbackProgramNotFoundError",
            "CON_ToastCashbackRestaurants"
        ],
        "CON_ToastCashbackRewardResult": [
            "CON_ToastCashbackAlreadyIssuedReward",
            "CON_ToastCashbackInvalidOrder",
            "CON_ToastCashbackReward",
            "CON_ToastCashbackRewardFailed"
        ],
        "CartModificationResponseOrError": [
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse",
            "CartValidationError"
        ],
        "CartResponseOrError": [
            "CartError",
            "CartResponse"
        ],
        "CompleteIdentityProfileResponseOrError": [
            "CompleteIdentityProfileError",
            "CompleteIdentityProfileResponse"
        ],
        "CompleteProfileCreationResponseOrError": [
            "CompleteProfileCreationError",
            "CompleteProfileCreationResponse"
        ],
        "ConfirmGuestIdentityResult": [
            "CodeAuthenticationError",
            "CodeExpiredError",
            "CodeMaxAttemptsReachedError",
            "ConfirmGuestIdentitySuccess",
            "GuestIdentityAlreadyExistsForAnotherGuestError",
            "IncorrectCodeError",
            "UnexpectedConfirmCodeError"
        ],
        "ConfirmGuestResult": [
            "CompleteGuestProfileInputRequiredError",
            "ConfirmGuestSuccess",
            "InvalidEmailError",
            "InvalidNameError",
            "ProfileLockedForDeletionError",
            "UnexpectedAuthError"
        ],
        "CreateCreditCardPreauthResponse": [
            "CreateCreditCardPreauthAuthorizedResponse",
            "CreateCreditCardPreauthDeniedResponse"
        ],
        "CreateGuestCommentOnPostResult": [
            "CreateGuestCommentOnPostSuccess",
            "GuestPostCommentModerationFailureError",
            "NotFollowingPostAuthorError",
            "UnexpectedError"
        ],
        "CreateGuestPasscodeResponse": [
            "CreateGuestPasscodeError",
            "GuestPasscode"
        ],
        "CreateMarketingSubscriptionRequestResponse": [
            "CreateMarketingSubscriptionRequestError",
            "CreateMarketingSubscriptionRequestSuccessResponse"
        ],
        "CreateOrUpdateCroppedProfilePhotoResult": [
            "GuestCroppedProfilePhotoSuccess",
            "UnexpectedError"
        ],
        "CreateOrUpdateGuestAwardResult": [
            "AwardSeasonHasEndedError",
            "AwardTypeNotFoundError",
            "CreateOrUpdateGuestAwardSuccess",
            "NoPlaceFoundError",
            "UnexpectedError"
        ],
        "CreateOrUpdateSocialUserProfilePhotoResult": [
            "GuestCreateOrUpdateProfilePhotoSuccess",
            "UnexpectedError"
        ],
        "CreateOrUpdateToastOrderPostResult": [
            "CreateOrUpdateToastOrderPostSuccess",
            "UnexpectedError"
        ],
        "CreateSetupIntentResponse": [
            "CreateSetupIntentSuccessResponse",
            "SetupIntentError"
        ],
        "CreateSocialUserResult": [
            "CreateSocialUserSuccess",
            "UnexpectedError"
        ],
        "CustomerLoyaltyInfoResponseOrError": [
            "CustomerLoyaltyError",
            "LoyaltyInquiryResponse"
        ],
        "DeleteAccountResponseOrError": [
            "DeleteAccountError",
            "DeleteAccountResponse"
        ],
        "DeleteAddressResponseOrError": [
            "DeleteAddressError",
            "DeleteAddressResponse"
        ],
        "DeleteCreditCardResponseOrError": [
            "DeleteCreditCardError",
            "DeleteCreditCardResponse"
        ],
        "DeleteGuestAddressResult": [
            "DeleteGuestAddressSuccess",
            "UnexpectedError"
        ],
        "DeleteGuestCommentOnPostResult": [
            "DeleteGuestCommentOnPostSuccess",
            "UnexpectedError"
        ],
        "DeleteGuestPaymentCardResult": [
            "DeleteGuestPaymentCardSuccess",
            "UnexpectedError"
        ],
        "DeleteSocialUserResult": [
            "DeleteSocialUserSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "DoMenus_FindMenuItemResult": [
            "DoMenus_FindMenuItemError",
            "DoMenus_FindMenuItemResponse"
        ],
        "DoMenus_FindMenuItemsResult": [
            "DoMenus_FindMenuItemsError",
            "DoMenus_FindMenuItemsResponse"
        ],
        "DoMenus_GetMenuGroupsResult": [
            "DoMenus_GetMenuGroupsError",
            "DoMenus_GetMenuGroupsResponse"
        ],
        "DoMenus_GetMenuItemsResult": [
            "DoMenus_GetMenuItemsError",
            "DoMenus_GetMenuItemsResponse"
        ],
        "DoMenus_GetMenusBulkResult": [
            "DoMenus_GetMenusBulkError",
            "DoMenus_GetMenusBulkResponse"
        ],
        "DoMenus_PopularItemsResult": [
            "DoMenus_PopularItemsError",
            "DoMenus_PopularItemsResponse"
        ],
        "EGiftCardShopCartResponseOrError": [
            "EGiftCardShopCartError",
            "EGiftCardShopCartResponse"
        ],
        "EcommerceResponse": [
            "EcommerceMutationErrorResponse",
            "EcommerceMutationSuccessResponse"
        ],
        "Error": [
            "AccountNotFoundError",
            "AlternativePaymentError",
            "ApplyBoostFundedOfferError",
            "ApplyCodeToGuestCurrencyAccountError",
            "ApplyPromoCodeError",
            "ApplyToastFundedOfferError",
            "AuthorizePaymentError",
            "AwardSeasonHasEndedError",
            "AwardTypeNotFoundError",
            "BackfillGuestOrderHistoryTooManyCardFingerprintsError",
            "BirthdayAlreadyExistsError",
            "BookingBulkAvailabilitiesRestaurantLimitExceeded",
            "BookingDepositAmountChanged",
            "BookingDepositRuleNotMatching",
            "BookingGuestNotFound",
            "BookingInternalError",
            "BookingInvalidBooking",
            "BookingInvalidEmail",
            "BookingInvalidPartySize",
            "BookingInvalidPhoneNumber",
            "BookingNoTableAvailable",
            "BookingNotFound",
            "BookingOverlappingBooking",
            "BookingPaymentNotFound",
            "BookingRequiresDepositData",
            "BookingRestaurantIsClosed",
            "BookingRestaurantLimitExceeded",
            "BookingRestaurantNotFound",
            "BookingServiceAreaNotFound",
            "BookingUnableToCreateDepositOrder",
            "BookingUnableToCreateGuest",
            "BookingUnableToFetchGuests",
            "BookingUnableToRefundDeposit",
            "BookingUnableToSendSMS",
            "BookingUnableToUpdateReservation",
            "BookingUnauthorizedGuestProfile",
            "BookingUnsupportedTransition",
            "CON_ToastCashbackAlreadyIssuedReward",
            "CON_ToastCashbackInvalidInputError",
            "CON_ToastCashbackInvalidOrder",
            "CON_ToastCashbackProgramNotFoundError",
            "CON_ToastCashbackRewardFailed",
            "CartError",
            "CartModificationError",
            "CartOutOfStockError",
            "CartValidationError",
            "CodeAuthenticationError",
            "CodeExpiredError",
            "CodeMaxAttemptsReachedError",
            "CommentDoesNotExistError",
            "CompleteGuestProfileInputRequiredError",
            "CompleteIdentityProfileError",
            "CompleteProfileCreationError",
            "CreateMarketingSubscriptionRequestError",
            "CustomerLoyaltyError",
            "DeleteAccountError",
            "DeleteAddressError",
            "DeleteCreditCardError",
            "EmailNotFoundError",
            "FingerprintCardError",
            "GeneralError",
            "GetOfferError",
            "GiftCardBalanceInquiryError",
            "GiftCardLookupError",
            "GiftCardNotFoundError",
            "GuestAddressLimitExceededError",
            "GuestAddressNotFoundError",
            "GuestFeedbackV2Error",
            "GuestIdentityAlreadyExistsForAnotherGuestError",
            "GuestIdentityAlreadyExistsForCurrentGuestError",
            "GuestPaymentCardNotFoundError",
            "GuestPostCommentModerationFailureError",
            "GuestTextReviewModerationFailureError",
            "IncorrectCodeError",
            "InvalidBirthdayError",
            "InvalidEmailError",
            "InvalidNameError",
            "InvalidPhoneFormatError",
            "InvalidRequestError",
            "InvalidSocialAcceptFollowRequestError",
            "ListSizeExceededError",
            "LoyaltyProgramNotActiveError",
            "LoyaltySignupError",
            "MakeCreditCardPrimaryError",
            "MarketingAccountsQueryError",
            "NoPlaceFoundError",
            "NotFollowingPostAuthorError",
            "OnlineOrderingPaymentIntentError",
            "OwnershipValidationError",
            "PasswordlessAuthenticationError",
            "PayForCheckError",
            "PlaceNotFoundError",
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PopularItemsError",
            "ProfileLockedForDeletionError",
            "RankedBoostFundedOffersError",
            "RankedPromoOffersError",
            "RankedToastFundedOffersError",
            "RemoveFundedOfferError",
            "RemoveOfferFromWalletError",
            "RemoveToastFundedOfferError",
            "ReorderError",
            "SaveOfferToWalletError",
            "SetupIntentError",
            "SignUpToLoyaltyError",
            "SingleIdentityInputRequiredError",
            "SocialCannotFollowSelfError",
            "SocialOnlyMeUserActionProhibitedError",
            "SocialUserBannedError",
            "SocialUserDoesNotExistError",
            "StartIdentityProfileError",
            "StartProfileCreationError",
            "StoredValueCreateGiftError",
            "StoredValueEligiblePaymentMethodsError",
            "StoredValueLoadFundsError",
            "StoredValueRedeemGiftError",
            "StoredValueRedeemGiftRecoverableError",
            "StoredValueRedeemableGiftError",
            "StoredValueRedeemedGiftLookupError",
            "StoredValueSentGiftsError",
            "TooManyGuestReviewImagesError",
            "UnexpectedAuthError",
            "UnexpectedConfirmCodeError",
            "UnexpectedError",
            "UnsupportedOrderTypeError",
            "UpdateAddressError",
            "UpdateBasicInfoError",
            "ValidateApplePayMerchantError"
        ],
        "FeaturedOffer": [
            "BoostFundedGuestOffer",
            "PromoCodeGuestOffer",
            "ToastFundedGuestOffer"
        ],
        "FeaturedOffersResult": [
            "FeaturedOffersSuccess",
            "UnexpectedError"
        ],
        "FingerprintAllCardsResponse": [
            "FingerprintAllCardsPartialSuccessResponse",
            "FingerprintAllCardsSuccessResponse",
            "UnexpectedError"
        ],
        "FutureFulfillmentTimeSlot": [
            "FutureFulfillmentServiceGap",
            "FutureFulfillmentTime"
        ],
        "GenerateGuestMediaPresignedUrlsResult": [
            "GenerateGuestMediaPresignedUrlsSuccess",
            "InvalidRequestError",
            "UnexpectedError"
        ],
        "GenerateGuestMediaUploadUrlsResult": [
            "GenerateGuestMediaUploadUrlsSuccess",
            "InvalidRequestError",
            "UnexpectedError"
        ],
        "GetAwardLeaderboardResult": [
            "GetAwardLeaderboardSuccess",
            "UnexpectedError"
        ],
        "GetAwardSeasonsResult": [
            "GetAwardSeasonsSuccess",
            "UnexpectedError"
        ],
        "GetMySocialUserResult": [
            "GetMySocialUserSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "GetOfferResult": [
            "GetOfferError",
            "GetOfferSuccess",
            "UnexpectedError"
        ],
        "GetSocialUsersResult": [
            "GetSocialUsersSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "GiftCardBalanceInquiryResponseOrError": [
            "GiftCardBalanceInquiryError",
            "GiftCardBalanceInquiryResponse"
        ],
        "GiftCardDataOrError": [
            "GiftCardData",
            "GiftCardLookupError",
            "GiftCardNotFoundError"
        ],
        "GiftCardSpiGetClientTokenResponse": [
            "GiftCardSpiGetClientTokenError",
            "GiftCardSpiGetClientTokenSuccessResponse"
        ],
        "GuestAIIOSAppScreen": [
            "GuestAIIOSAppAuthenticatedHomeScreen",
            "GuestAIIOSAppForceUpdateScreen",
            "GuestAIIOSAppSignInScreen"
        ],
        "GuestComment": [
            "HiddenGuestComment",
            "VisibleGuestComment"
        ],
        "GuestCommentReportReasonsResult": [
            "GuestCommentReportReasonsSuccess",
            "UnexpectedError"
        ],
        "GuestCurrencyTransaction": [
            "GuestCurrencyExpirableUnit",
            "GuestCurrencyExpiration",
            "GuestCurrencySpend",
            "GuestCurrencyStoredValueGiftUnit",
            "GuestCurrencyStoredValueLoadUnit"
        ],
        "GuestCurrencyUnit": [
            "GuestCurrencyExpirableUnit",
            "GuestCurrencyStoredValueGiftUnit",
            "GuestCurrencyStoredValueLoadUnit"
        ],
        "GuestFeedbackResponse": [
            "GuestFeedback",
            "GuestFeedbackError"
        ],
        "GuestNotificationHubItem": [
            "CampaignProgressUpdateNotificationHubItem",
            "CampaignRewardIssuedNotificationHubItem",
            "FollowRequestAcceptedGuestNotificationHubItem",
            "NewFollowRequestGuestNotificationHubItem",
            "NewFollowerGuestNotificationHubItem",
            "PostCommentCreatedNotificationHubItem",
            "PostCommentReplyNotificationHubItem",
            "ReviewOrderGuestNotificationHubItem",
            "SavedOfferExpiringNotificationHubItem",
            "SocialUserReactedToPostNotificationHubItem",
            "ToastMarketingNotificationHubItem"
        ],
        "GuestOffer": [
            "BoostFundedGuestOffer",
            "PromoCodeGuestOffer",
            "ToastFundedGuestOffer"
        ],
        "GuestOrderReviewPromptResult": [
            "GuestOrderReviewPrompt",
            "UnexpectedError"
        ],
        "GuestPostContent": [
            "PlaceVideoGuestPostContent",
            "ToastOrderGuestPostContent"
        ],
        "GuestRestaurantsSummaryDataResult": [
            "GuestRestaurantsSummaryDataSuccess",
            "UnexpectedError"
        ],
        "GuestSavedListItem": [
            "PlaceGuestSavedListItem"
        ],
        "InAppCheckIn_GetTableCheckResponse": [
            "InAppCheckIn_GetTableCheckError",
            "InAppCheckIn_GetTableCheckSuccess"
        ],
        "InAppCheckIn_GetTablesResponse": [
            "InAppCheckIn_GetTablesError",
            "InAppCheckIn_GetTablesSuccess"
        ],
        "InAppCheckIn_LinkCheckResponse": [
            "InAppCheckIn_LinkCheckError",
            "InAppCheckIn_LinkCheckSuccess"
        ],
        "InAppCheckIn_OpenChecksResponse": [
            "InAppCheckIn_OpenChecksError",
            "InAppCheckIn_OpenChecksSuccess"
        ],
        "InfluencersByLocationResult": [
            "InfluencersByLocationSuccess",
            "UnexpectedError"
        ],
        "Info": [
            "CartInfo"
        ],
        "InitiateCardLinkingByPaymentMethodIdResponse": [
            "InitiateCardLinkingByPaymentMethodIdSuccess",
            "UnexpectedError"
        ],
        "ItemDetailOfferBadgeResponseOrError": [
            "GeneralError",
            "ItemDetailOfferBadgeResponse"
        ],
        "ItemFeedbackConfigResponse": [
            "ItemFeedbackConfig",
            "ItemFeedbackConfigError"
        ],
        "ItemOrderHistoryResponseOrError": [
            "InvalidOffsetError",
            "ItemOrderHistoryResponse",
            "MissingCustomerOrGuestGuidError"
        ],
        "LinkCardFingerprintByPaymentMethodIdResponse": [
            "LinkCardFingerprintByPaymentMethodIdSuccess",
            "UnexpectedError"
        ],
        "LinkCardFingerprintResponse": [
            "LinkCardFingerprintSuccess",
            "UnexpectedError"
        ],
        "LoyaltyInquiryResponseOrError": [
            "CartOutOfStockError",
            "CustomerLoyaltyError",
            "LoyaltyInquiryResponse"
        ],
        "LoyaltySignupResponseOrError": [
            "LoyaltySignupError",
            "LoyaltySignupResponse"
        ],
        "MakeCreditCardPrimaryResponseOrError": [
            "MakeCreditCardPrimaryError",
            "MakeCreditCardPrimaryResponse"
        ],
        "MarketingAccountsQueryResponse": [
            "MarketingAccountsQueryError",
            "MarketingAccountsQuerySuccessResponse"
        ],
        "MarketingConfigQueryResponse": [
            "MarketingConfigQueryError",
            "MarketingConfigQuerySuccessResponse"
        ],
        "MenuOfferBadgesResponseOrError": [
            "GeneralError",
            "MenuOfferBadgesResponse"
        ],
        "MenusResponseOrError": [
            "GeneralError",
            "MenusResponse"
        ],
        "ModifyGuestSavedListsResponse": [
            "ListSizeExceededError",
            "ModifyGuestSavedListsSuccess",
            "UnexpectedError"
        ],
        "NearbyOffersResult": [
            "NearbyOffersSuccess",
            "UnexpectedError"
        ],
        "NewGuestAddressResult": [
            "GuestAddressLimitExceededError",
            "NewGuestAddressSuccess",
            "UnexpectedError"
        ],
        "NotificationHubCampaignReward": [
            "NotificationHubPromotionalGuestCurrencyReward"
        ],
        "OPT_CheckSelection": [
            "OPT_CheckSelectionGuid",
            "OPT_CheckSelectionNoGuid"
        ],
        "OPT_CreatePaymentIntentResponse": [
            "OPT_PaymentIntent",
            "OPT_PaymentIntentError"
        ],
        "OPT_Error": [
            "OPT_GeneralError",
            "OPT_GetMenusError",
            "OPT_GetPopularItemsError",
            "OPT_ItemFeedbackSurveyError",
            "OPT_OPTCartError",
            "OPT_OPTOrderError",
            "OPT_OPTPartiesLookupError",
            "OPT_OPTPartyError",
            "OPT_OPTPartyPaymentError",
            "OPT_OPTPartyPaymentErrorV2",
            "OPT_OPTSplitCheckPaymentError",
            "OPT_PayForCheckError",
            "OPT_PlaceOrderCartUpdatedError",
            "OPT_PlaceOrderError",
            "OPT_PlaceOrderOutOfStockError",
            "OPT_SignUpToLoyaltyError",
            "OPT_UpdateBasicInfoError",
            "OPT_ValidateApplePayMerchantError"
        ],
        "OPT_FeatureFlagResult": [
            "OPT_BooleanFeatureFlagResult",
            "OPT_NumericFeatureFlagResult",
            "OPT_StringFeatureFlagResult"
        ],
        "OPT_GetMenusResponseOrError": [
            "OPT_GetMenusError",
            "OPT_GetMenusResponse"
        ],
        "OPT_GetPopularItemsResponse": [
            "OPT_GetPopularItemsError",
            "OPT_PopularItemsV3"
        ],
        "OPT_IncrementAuthorizationResponse": [
            "OPT_IncrementAuthorizationFailure",
            "OPT_IncrementalAuthorization"
        ],
        "OPT_Info": [],
        "OPT_ItemFeedbackSurveyResponse": [
            "OPT_ItemFeedbackSurvey",
            "OPT_ItemFeedbackSurveyError"
        ],
        "OPT_ItemLevelFeedbackSubmissionsStatus": [
            "OPT_ItemLevelFeedbackSubmissionFailure",
            "OPT_ItemLevelFeedbackSubmissionSuccess"
        ],
        "OPT_MDSCustomServerNotificationResponse": [
            "OPT_MDSServerNotificationResponse",
            "OPT_OPTPartyError"
        ],
        "OPT_OPTCartResponse": [
            "OPT_OPTCart",
            "OPT_OPTCartError"
        ],
        "OPT_OPTCheckV2": [
            "OPT_OPTCheckV2Guid",
            "OPT_OPTCheckV2NoGuid",
            "OPT_OPTSplitCheckPreview"
        ],
        "OPT_OPTCloseoutResponse": [
            "OPT_OPTPartyPaymentErrorV2",
            "OPT_OPTPartyPaymentResponse",
            "OPT_OPTSplitCheckPaymentError"
        ],
        "OPT_OPTOrder": [
            "OPT_OPTOrderGuid",
            "OPT_OPTOrderNoGuid"
        ],
        "OPT_OPTPartiesLookupResponse": [
            "OPT_OPTParties",
            "OPT_OPTPartiesLookupError"
        ],
        "OPT_OPTPartyCartResponse": [
            "OPT_OPTCart",
            "OPT_OPTPartyError"
        ],
        "OPT_OPTPartyRefreshResponseV2": [
            "OPT_OPTPartyError",
            "OPT_OPTPartyRefreshV2"
        ],
        "OPT_OPTPartyResponseV2": [
            "OPT_OPTPartyError",
            "OPT_OPTPartyV2"
        ],
        "OPT_OPTPartyStubResponse": [
            "OPT_OPTPartyError",
            "OPT_OPTPartyStub"
        ],
        "OPT_OPTSplitCheckResponse": [
            "OPT_OPTPartyError",
            "OPT_OPTSplitCheckPreview"
        ],
        "OPT_PartyMemberResponse": [
            "OPT_OPTPartyError",
            "OPT_OPTPartyMemberV2"
        ],
        "OPT_PayForCheckResponseOrError": [
            "OPT_PayForCheckError",
            "OPT_PayForCheckResponse"
        ],
        "OPT_PlaceApplePayOrderResponse": [
            "OPT_PlaceOrderCartUpdatedError",
            "OPT_PlaceOrderError",
            "OPT_PlaceOrderOutOfStockError",
            "OPT_PlaceOrderResponse"
        ],
        "OPT_PlaceOPTOrderResponse": [
            "OPT_OPTOrderError",
            "OPT_OPTPayForCheckResponse"
        ],
        "OPT_RestaurantOrError": [
            "OPT_GeneralError",
            "OPT_Restaurant"
        ],
        "OPT_SignUpToLoyaltyResponseOrError": [
            "OPT_SignUpToLoyaltyError",
            "OPT_SignUpToLoyaltyResponse"
        ],
        "OPT_UpdateBasicInfoResponseOrError": [
            "OPT_UpdateBasicInfoError",
            "OPT_UpdateBasicInfoResponse"
        ],
        "OPT_UpdatePaymentIntentResponse": [
            "OPT_PaymentIntentError",
            "OPT_UpdatePaymentIntentSuccess"
        ],
        "OPT_ValidateApplePayMerchantResponse": [
            "OPT_ValidateApplePayMerchantError",
            "OPT_ValidateApplePayMerchantSuccessResponse"
        ],
        "OPT_Warning": [
            "OPT_PlaceOrderWarning"
        ],
        "OfferBadge": [
            "MenuGroupOfferBadge",
            "MenuItemOfferBadge",
            "MenuOfferBadge"
        ],
        "OfferTargeting": [
            "LocationTargeting",
            "NoTargeting",
            "RestaurantTargeting"
        ],
        "OnlineOrderingSpiCreatePaymentIntentResponse": [
            "OnlineOrderingPaymentIntentError",
            "OnlineOrderingSpiCreatePaymentIntentSuccessResponse"
        ],
        "OnlineOrderingSpiGetClientTokenResponse": [
            "OnlineOrderingPaymentIntentError",
            "OnlineOrderingSpiGetClientTokenSuccessResponse"
        ],
        "OnlineOrderingSpiUpdatePaymentIntentResponse": [
            "OnlineOrderingPaymentIntentError",
            "OnlineOrderingSpiUpdatePaymentIntentSuccessResponse"
        ],
        "Page": [
            "GuestCurrencyExpirableUnitPage",
            "GuestCurrencyUnitPage",
            "StoredValueGiftPage"
        ],
        "PageItem": [
            "GuestCurrencyExpirableUnit",
            "GuestCurrencyStoredValueGiftUnit",
            "GuestCurrencyStoredValueLoadUnit",
            "StoredValueGiftDetails"
        ],
        "Pageable": [
            "WalletOffersPage"
        ],
        "PartyValidateFundedOfferResponse": [
            "PartyValidateFundedOfferError",
            "PartyValidateFundedOfferMinAmountNotMet",
            "PartyValidateFundedOfferSuccess"
        ],
        "PasswordlessLoginResponseOrError": [
            "PasswordlessAuthenticationError",
            "PasswordlessLoginResponse"
        ],
        "PasswordlessLoginUnifiedResponseOrError": [
            "PasswordlessAuthenticationError",
            "PasswordlessLoginUnifiedResponse"
        ],
        "PasswordlessLogoutResponseOrError": [
            "PasswordlessAuthenticationError",
            "PasswordlessLogoutResponse"
        ],
        "PasswordlessSignupResponseOrError": [
            "PasswordlessAuthenticationError",
            "PasswordlessSignupResponse"
        ],
        "PasswordlessTokenResponseOrError": [
            "PasswordlessAuthenticationError",
            "PasswordlessTokenResponse"
        ],
        "PasswordlessTokenUnifiedResponseOrError": [
            "PasswordlessAuthenticationError",
            "PasswordlessTokenUnifiedResponse"
        ],
        "PayApplyOfferResponse": [
            "PayApplyOfferError",
            "PayApplyOfferSuccess"
        ],
        "PayApplyPromoCodeResponse": [
            "PayApplyPromoCodeError",
            "PayApplyPromoCodeSuccess"
        ],
        "PayBearerTokenResponse": [
            "PayBearerToken",
            "PayBearerTokenError"
        ],
        "PayBreakdownLine": [
            "PayChargeLine",
            "PayDiscountLine",
            "PayPaymentLine",
            "PaySubtotalLine",
            "PayTaxLine",
            "PayTipLine",
            "PayTotalLine"
        ],
        "PayCheckoutByCheckResponse": [
            "PayCheckoutByCheckError",
            "PayCheckoutByCheckSuccess"
        ],
        "PayCheckoutByOrderResponse": [
            "PayCheckoutByOrderError",
            "PayCheckoutByOrderSuccess"
        ],
        "PayCloseoutByCheckResponse": [
            "PayCloseoutByCheckError",
            "PayCloseoutByCheckSuccess"
        ],
        "PayCreateMarketingSubscriptionResponse": [
            "PayMarketingSubscriptionError",
            "PayMarketingSubscriptionSuccess"
        ],
        "PayCreatePaymentIntentByCheckResponse": [
            "PayPaymentIntent",
            "PayPaymentIntentError"
        ],
        "PayForCheckResponseOrError": [
            "PayForCheckError",
            "PayForCheckResponse"
        ],
        "PayLine": [
            "PayDiscountLine",
            "PaySelectionLine",
            "PaySubtotalLine"
        ],
        "PayNamedAmount": [
            "PayChargeLine",
            "PayDiscountLine",
            "PayModifierLine",
            "PayPaymentLine",
            "PaySelectionLine",
            "PaySubtotalLine",
            "PayTaxLine",
            "PayTipLine",
            "PayTotalLine"
        ],
        "PaySelectionSubLine": [
            "PayDiscountLine",
            "PayModifierLine"
        ],
        "PaySplitCheckByItemPreviewResponse": [
            "PaySplitCheckByItemAvailabilityError",
            "PaySplitCheckByItemError",
            "PaySplitCheckByItemPreviewSuccess"
        ],
        "PaySplitCheckByItemResponse": [
            "PaySplitCheckByItemAvailabilityError",
            "PaySplitCheckByItemError",
            "PaySplitCheckByItemSuccess"
        ],
        "PaySplittableItemsResponse": [
            "PaySplittableItemsError",
            "PaySplittableItemsSuccess"
        ],
        "PayUpdatePaymentIntentByCheckResponse": [
            "PayUpdatePaymentIntentByCheckError",
            "PayUpdatePaymentIntentByCheckSuccess"
        ],
        "PaymentIntentResponseOrError": [
            "AlternativePaymentError",
            "PaymentIntentResponse"
        ],
        "PlaceApmOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PlaceOrderResponse"
        ],
        "PlaceApplePayOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PlaceOrderResponse"
        ],
        "PlaceCashOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PlaceOrderResponse"
        ],
        "PlaceCcOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PlaceOrderResponse"
        ],
        "PlaceGiftCardOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PlaceOrderResponse"
        ],
        "PlacePaidOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderOutOfStockError",
            "PlaceOrderResponse"
        ],
        "PlaceResult": [
            "PlaceNotFoundError",
            "PlaceSuccess",
            "UnexpectedError"
        ],
        "PlaceSpiOrderResponse": [
            "PlaceOrderCartUpdatedError",
            "PlaceOrderError",
            "PlaceOrderResponse"
        ],
        "PopularItemsResponseOrError": [
            "PopularItemsError",
            "PopularItemsResponse"
        ],
        "ProfileLockedError": [
            "ProfileLockedForDeletionError"
        ],
        "PromoBannerBase": [
            "DeliveryBanner",
            "GiftCardPromoBanner",
            "LoyaltyBanner",
            "PromoCodeBanner"
        ],
        "PromoBannerResponseOrError": [
            "GeneralError",
            "PromoBannerResponse"
        ],
        "PromoOfferDiscountsResponseOrError": [
            "GeneralError",
            "PromoOfferDiscountsResponse"
        ],
        "RankedBoostFundedOffer": [
            "RankedBoostDiscountOffMinOffer",
            "RankedBoostFreeDeliveryOffer"
        ],
        "RankedBoostFundedOffersResponseOrError": [
            "RankedBoostFundedOffersError",
            "RankedBoostFundedOffersResponse"
        ],
        "RankedPromoOffersResponseOrError": [
            "RankedPromoOffersError",
            "RankedPromoOffersResponse"
        ],
        "RankedToastFundedOffer": [
            "RankedDiscountOffMinOffer",
            "RankedFreeDeliveryOffer"
        ],
        "RankedToastFundedOffersResponseOrError": [
            "RankedToastFundedOffersError",
            "RankedToastFundedOffersResponse"
        ],
        "RejectSocialFollowersResult": [
            "RejectSocialFollowersSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "RemoveFundedOfferResponseOrError": [
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse",
            "RemoveFundedOfferError"
        ],
        "RemoveGuestAwardResult": [
            "AwardSeasonHasEndedError",
            "RemoveGuestAwardSuccess",
            "UnexpectedError"
        ],
        "RemoveGuestReactionFromPostResponse": [
            "RemoveGuestReactionFromPostSuccess",
            "UnexpectedError"
        ],
        "RemoveGuestToastOrderImageReviewsResult": [
            "RemoveGuestToastOrderImageReviewsSuccess",
            "UnexpectedError"
        ],
        "RemoveOfferFromWalletResult": [
            "RemoveOfferFromWalletError",
            "RemoveOfferFromWalletSuccess"
        ],
        "RemovePromoCodeResponseOrError": [
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse"
        ],
        "RemoveSocialFollowersResult": [
            "RemoveSocialFollowersSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "RemoveSocialUserProfilePhotoResult": [
            "RemoveSocialUserProfilePhotoSuccess",
            "UnexpectedError"
        ],
        "RemoveToastFundedOfferResponseOrError": [
            "CartModificationError",
            "CartOutOfStockError",
            "CartResponse",
            "RemoveToastFundedOfferError"
        ],
        "ReorderResponseOrError": [
            "ReorderError",
            "ReorderResponse"
        ],
        "ReportGuestCommentResult": [
            "CommentDoesNotExistError",
            "ReportGuestCommentSuccess",
            "UnexpectedError"
        ],
        "ReportGuestPostResult": [
            "ReportGuestPostSuccess",
            "UnexpectedError"
        ],
        "ReportSocialUserResult": [
            "ReportSocialUserSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "RequestDigitalReceiptResponseOrError": [
            "EmailNotFoundError",
            "RequestDigitalReceiptResponse",
            "UnexpectedError",
            "UnsupportedOrderTypeError"
        ],
        "RestaurantBusynessProfileResponse": [
            "RestaurantBusynessErrorResponse",
            "RestaurantBusynessProfile"
        ],
        "RestaurantBusynessResponse": [
            "RestaurantBusynessData",
            "RestaurantBusynessErrorResponse"
        ],
        "RestaurantOffer": [
            "PromoCodeGuestOffer",
            "ToastFundedGuestOffer"
        ],
        "RestaurantOfferBadgeResponseOrError": [
            "GeneralError",
            "RestaurantOfferBadgeResponse"
        ],
        "RestaurantOfferBadgeV2ResponseOrError": [
            "GeneralError",
            "RestaurantOfferBadgeV2Response"
        ],
        "RestaurantOrError": [
            "GeneralError",
            "Restaurant"
        ],
        "RestaurantSearchResultsOrError": [
            "GeneralError",
            "RestaurantSearchResults"
        ],
        "SaveOfferToWalletResult": [
            "SaveOfferToWalletError",
            "SaveOfferToWalletSuccess"
        ],
        "SetDefaultPaymentMethodResponse": [
            "SetDefaultPaymentMethodError",
            "SetDefaultPaymentMethodSuccessResponse"
        ],
        "SetupGuestResult": [
            "InvalidPhoneFormatError",
            "ProfileLockedForDeletionError",
            "SetupGuestSuccess",
            "SingleIdentityInputRequiredError",
            "UnexpectedAuthError"
        ],
        "SetupIntentBearerTokenResponse": [
            "SetupIntentBearerToken",
            "SetupIntentBearerTokenError"
        ],
        "SignUpToLoyaltyResponseOrError": [
            "SignUpToLoyaltyError",
            "SignUpToLoyaltyResponse"
        ],
        "SocialFollowResult": [
            "SocialCannotFollowSelfError",
            "SocialFollowSuccess",
            "SocialOnlyMeUserActionProhibitedError",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "SocialUnfollowResult": [
            "SocialUnfollowSuccess",
            "SocialUserDoesNotExistError",
            "UnexpectedError"
        ],
        "SocialUserReportReasonsResult": [
            "SocialUserReportReasonsSuccess",
            "UnexpectedError"
        ],
        "SocialUserSearchResult": [
            "SocialUserSearchSuccess",
            "UnexpectedError"
        ],
        "StartProfileCreationResponseOrError": [
            "StartProfileCreationError",
            "StartProfileCreationResponse"
        ],
        "StoredValueCreateGiftResponse": [
            "StoredValueCreateGiftError",
            "StoredValueCreateGiftSuccess"
        ],
        "StoredValueEligiblePaymentMethodsResult": [
            "StoredValueEligiblePaymentMethodsError",
            "StoredValueEligiblePaymentMethodsSuccess"
        ],
        "StoredValueLoadFundsResponse": [
            "StoredValueLoadFundsError",
            "StoredValueLoadFundsSuccess"
        ],
        "StoredValueRedeemGiftResponse": [
            "StoredValueRedeemGiftError",
            "StoredValueRedeemGiftRecoverableError",
            "StoredValueRedeemGiftSuccess"
        ],
        "StoredValueRedeemableGiftResponse": [
            "StoredValueRedeemableGiftError",
            "StoredValueRedeemableGiftSuccess"
        ],
        "StoredValueRedeemedGiftLookupResponse": [
            "StoredValueRedeemedGiftLookupError",
            "StoredValueRedeemedGiftLookupSuccess"
        ],
        "StoredValueSentGiftsResult": [
            "StoredValueGiftPage",
            "StoredValueSentGiftsError"
        ],
        "SubmitGuestFeedbackV2Response": [
            "GuestFeedbackV2Error",
            "GuestFeedbackV2SuccessResponse"
        ],
        "SubmitGuestRatingResult": [
            "GuestRating",
            "SubmitGuestRatingSuccess",
            "UnexpectedError"
        ],
        "SubmitGuestToastOrderImageReviewsResult": [
            "SubmitGuestToastOrderImageReviewsSuccess",
            "TooManyGuestReviewImagesError",
            "UnexpectedError"
        ],
        "SubmitGuestToastOrderTextReviewResult": [
            "GuestTextReviewModerationFailureError",
            "SubmitGuestToastOrderTextReviewSuccess",
            "UnexpectedError"
        ],
        "ToastFundedOffer": [
            "DiscountOffMinOffer",
            "FreeDeliveryOffer"
        ],
        "ToastOrderGuestPostContentHighlight": [
            "ToastOrderGuestPostContentImageReview",
            "ToastOrderGuestPostContentUniqueMenuItem"
        ],
        "ToastOrderGuestPostResult": [
            "ToastOrderGuestPostSuccess",
            "UnexpectedError"
        ],
        "UnbanSocialUserResult": [
            "SocialUserDoesNotExistError",
            "UnbanSocialUserSuccess",
            "UnexpectedError"
        ],
        "UnlinkCardFingerprintResponse": [
            "UnexpectedError",
            "UnlinkCardFingerprintSuccess"
        ],
        "UpdateAddressResponseOrError": [
            "UpdateAddressError",
            "UpdateAddressResponse"
        ],
        "UpdateBasicInfoResponseOrError": [
            "UpdateBasicInfoError",
            "UpdateBasicInfoResponse"
        ],
        "UpdateGuestAddressResult": [
            "GuestAddressNotFoundError",
            "UnexpectedError",
            "UpdateGuestAddressSuccess"
        ],
        "UpdateGuestContactResult": [
            "InvalidNameError",
            "UnexpectedError",
            "UpdateGuestContactSuccess"
        ],
        "UpdateGuestPostVisibilityResult": [
            "UnexpectedError",
            "UpdateGuestPostVisibilitySuccess"
        ],
        "UpdateLoyaltyAccountInfoResult": [
            "AccountNotFoundError",
            "LoyaltyProgramNotActiveError",
            "OwnershipValidationError",
            "UnexpectedError",
            "UpdateLoyaltyAccountInfoSuccess"
        ],
        "UpdateMySocialUserResult": [
            "SocialUserBannedError",
            "SocialUserDoesNotExistError",
            "UnexpectedError",
            "UpdateMySocialUserSuccess"
        ],
        "UpdatePrimaryGuestPaymentCardResult": [
            "GuestPaymentCardNotFoundError",
            "UnexpectedError",
            "UpdatePrimaryGuestPaymentCardSuccess"
        ],
        "UrlShortenerResolvedResponseOrError": [
            "UrlShortenerResolvedResponse",
            "UrlShortenerResponseError"
        ],
        "UrlShorteningResponseOrError": [
            "UrlShortenerResponseError",
            "UrlShorteningResponse"
        ],
        "ValidateApplePayMerchantResponse": [
            "ValidateApplePayMerchantError",
            "ValidateApplePayMerchantSuccessResponse"
        ],
        "ValidationError": [
            "BackfillGuestOrderHistoryTooManyCardFingerprintsError",
            "InvalidBirthdayError",
            "InvalidEmailError",
            "InvalidNameError",
            "InvalidPhoneFormatError",
            "SingleIdentityInputRequiredError"
        ],
        "Walkout_CreatePreauthOrderForBookingResponse": [
            "Walkout_CreatePreauthOrderForBookingError",
            "Walkout_CreatePreauthOrderForBookingSuccess"
        ],
        "Walkout_WalkoutResponse": [
            "Walkout_WalkoutError",
            "Walkout_WalkoutSuccess"
        ],
        "WalletOffer": [
            "BoostFundedGuestOffer",
            "PromoCodeGuestOffer",
            "ToastFundedGuestOffer"
        ],
        "Warning": [
            "CartWarning",
            "DeliveryUnavailableReason",
            "PlaceOrderWarning",
            "ReorderWarning"
        ]
    }
};
export default result;
