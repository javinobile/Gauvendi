import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Response } from 'express';
import { Public } from '../../core/decorators/is-public.decorator';
import { Agent } from 'https';

@Controller('graphql')
export class GraphqlProxyController {
    constructor(private readonly httpService: HttpService) { }

    @Public()
    @Post()
    async proxyGraphql(
        @Body() body: any,
        @Headers() headers: any,
        @Res() res: Response
    ) {
        let operationName = body?.operationName;

        // Fallback: Try to extract operation name from query string if not provided
        if (!operationName && typeof body?.query === 'string') {
            const match = body.query.match(/query\s+([a-zA-Z0-9_]+)/);
            if (match && match[1]) {
                operationName = match[1];
            }
        }

        operationName = operationName || 'Unknown';

        console.log(`Incoming GraphQL Operation: ${operationName}`);
        // console.log('Request Body:', JSON.stringify(body).substring(0, 200) + '...'); // Debug logging

        // MOCK: HotelList
        // Frontend expects alias "response", so we must return "response" instead of "hotelList"
        if (operationName === 'HotelList' || (typeof body?.query === 'string' && body.query.includes('hotelList'))) {
            console.log('Returning MOCK for HotelList');
            return res.status(200).json({
                data: {
                    response: { // ALIAS MATCH
                        count: 1, totalPage: 1,
                        data: [{
                            id: 'mock-id-1', name: 'GauVendi Test Hotel', code: 'GV000001', timeZone: 'Europe/Madrid',
                            iconImageUrl: '', iconSymbolUrl: 'https://placehold.co/100', state: 'Madrid', city: 'Madrid', address: 'Mock Address',
                            phoneCode: '+34', phoneNumber: '000000000', emailAddressList: ['mock@test.com'], postalCode: '00000',
                            signature: 'Mock Hotel', backgroundCategoryImageUrl: '', customThemeImageUrl: '', lowestPriceImageUrl: '',
                            measureMetric: 'm2', addressDisplay: 'Mock Address', isCityTaxIncludedSellingPrice: true,
                            brand: { name: 'Mock Brand' },
                            country: { code: 'ES', name: 'Spain', phoneCode: '+34', translationList: [] },
                            taxSetting: {
                                isTaxIncluded: true,
                                taxRuleList: []
                            },
                            serviceChargeSetting: {
                                isServiceChargeIncluded: true,
                                serviceChargeRuleList: []
                            },
                            hotelPaymentModeList: [],
                            hotelConfigurationList: [
                                { configType: 'Tax', configValue: { value: '10' } }, // Example config
                                { configType: 'ServiceCharge', configValue: { value: '0' } }
                            ],
                            paymentAccount: null,
                            baseCurrency: {
                                code: 'EUR',
                                currencyRateList: [
                                    { rate: 1, exchangeCurrency: { code: 'EUR' } },
                                    { rate: 1.1, exchangeCurrency: { code: 'USD' } }
                                ]
                            },
                            stayOptionBackgroundImageUrl: '', customizeStayOptionBackgroundImageUrl: '', stayOptionSuggestionImageUrl: '', signatureBackgroundImageUrl: ''
                        }]
                    }
                }
            });
        }

        // MOCK: CountryList
        if (operationName === 'CountryList' || (typeof body?.query === 'string' && body.query.includes('countryList'))) {
            console.log('Returning MOCK for CountryList');
            return res.status(200).json({
                data: {
                    response: [ // ALIAS MATCH
                        { code: 'ES', name: 'Spain', phoneCode: '+34', translationList: [] },
                        { code: 'US', name: 'United States', phoneCode: '+1', translationList: [] }
                    ]
                }
            });
        }

        // MOCK: CurrencyList
        if (operationName === 'CurrencyList' || (typeof body?.query === 'string' && body.query.includes('currencyList'))) {
            console.log('Returning MOCK for CurrencyList');
            return res.status(200).json({
                data: {
                    response: [ // ALIAS MATCH
                        { code: 'EUR', symbol: '€', name: 'Euro' },
                        { code: 'USD', symbol: '$', name: 'US Dollar' }
                    ]
                }
            });
        }

        // MOCK: PropertyBrandingList (Used in BrandingGuard)
        if (operationName === 'PropertyBrandingList' || (typeof body?.query === 'string' && body.query.includes('propertyBrandingList'))) {
            console.log('Returning MOCK for PropertyBrandingList');
            return res.status(200).json({
                data: {
                    response: {
                        data: [] // Guards expect data property
                    }
                }
            });
        }

        // MOCK: PropertyMainFontInformation (Used in BrandingGuard)
        if (operationName === 'PropertyMainFontInformation' || (typeof body?.query === 'string' && body.query.includes('propertyMainFontInformation'))) {
            console.log('Returning MOCK for PropertyMainFontInformation');
            return res.status(200).json({
                data: {
                    response: {
                        data: [] // Guards expect data property
                    }
                }
            });
        }

        // MOCK: IbeNearestAvailableDate (Used in ValidationGuard)
        if (operationName === 'IbeNearestAvailableDate' || (typeof body?.query === 'string' && body.query.includes('ibeNearestAvailableDate'))) {
            console.log('Returning MOCK for IbeNearestAvailableDate');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(tomorrow.getDate() + 1);

            return res.status(200).json({
                data: {
                    response: {
                        data: [{
                            arrival: tomorrow.toISOString().split('T')[0],
                            departure: dayAfter.toISOString().split('T')[0]
                        }]
                    }
                }
            });
        }

        // FALLBACK FOR EVERYTHING ELSE
        // Since the remote sandbox is dead (404), there is no point in proxying.
        // We return an empty data object to prevent frontend network errors.
        console.log(`Returning GENERIC EMPTY MOCK for: ${operationName}`);
        return res.status(200).json({
            data: {
                response: {} // Generic fallback with response key to avoid destructuring errors
            }
        });
    }
}
