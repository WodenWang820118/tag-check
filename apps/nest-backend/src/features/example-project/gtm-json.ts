export const exampleGtmJson = {
  exportFormatVersion: 2,
  exportTime: '2025-08-22 06:14:14',
  containerVersion: {
    path: 'accounts/6140708819/containers/168785492/versions/0',
    accountId: '6140708819',
    containerId: '168785492',
    containerVersionId: '0',
    container: {
      path: 'accounts/6140708819/containers/168785492',
      accountId: '6140708819',
      containerId: '168785492',
      name: 'ng-gtm-site',
      publicId: 'GTM-NBMX2DWS',
      usageContext: ['WEB'],
      fingerprint: '1697613095849',
      tagManagerUrl:
        'https://tagmanager.google.com/#/container/accounts/6140708819/containers/168785492/workspaces?apiLink=container',
      features: {
        supportUserPermissions: true,
        supportEnvironments: true,
        supportWorkspaces: true,
        supportGtagConfigs: false,
        supportBuiltInVariables: true,
        supportClients: false,
        supportFolders: true,
        supportTags: true,
        supportTemplates: true,
        supportTriggers: true,
        supportVariables: true,
        supportVersions: true,
        supportZones: true,
        supportTransformations: false
      },
      tagIds: ['GTM-NBMX2DWS']
    },
    tag: [
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '109',
        name: 'GA4 event - add_shipping_info',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'add_shipping_info'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756157564',
        firingTriggerId: ['107'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '114',
        name: 'GA4 event - remove_from_cart',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'remove_from_cart'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756227129',
        firingTriggerId: ['113'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '116',
        name: 'GA4 event - view_promotion',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.creative_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_slot'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.creative_slot}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_id'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.promotion_id}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.promotion_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'view_promotion'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756271548',
        firingTriggerId: ['115'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '119',
        name: 'GA4 event - add_payment_info',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'true'
          },
          {
            type: 'TEMPLATE',
            key: 'getEcommerceDataFrom',
            value: 'dataLayer'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'add_payment_info'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756701458',
        firingTriggerId: ['111'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '126',
        name: 'GA4 event - select_promotion',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.creative_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_slot'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.creative_slot}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_id'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.promotion_id}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.promotion_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'select_promotion'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756247143',
        firingTriggerId: ['125'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '128',
        name: 'GA4 event - view_cart',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'view_cart'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756253787',
        firingTriggerId: ['127'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '131',
        name: 'GA4 event - add_to_cart',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom] GA4 Items array}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_id'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom JS] promo - promotion_id}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'promotion_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom JS] promo - promotion_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_name'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom JS] promo - creative_name}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'creative_slot'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom JS] promo - creative_slot}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'add_to_cart'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756173842',
        firingTriggerId: ['130'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '132',
        name: 'GA4 Configuration',
        type: 'googtag',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'tagId',
            value: '{{CONST - Measurement ID}}'
          },
          {
            type: 'LIST',
            key: 'configSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'send_page_view'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: 'false'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'allow_ad_personalization_signals'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{CJS - allow_ad_personalization_signals}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'allow_google_signals'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{CJS - allow_google_signals}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'debug_mode'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: 'false'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_referrer'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Old History Fragment}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_location'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{New History Fragment}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'update'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: 'true'
                  }
                ]
              }
            ]
          }
        ],
        fingerprint: '1734756406343',
        firingTriggerId: ['193', '188'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '133',
        name: 'GA4 event - purchase',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'transaction_id'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.transaction_id}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom] GA4 Items array}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'purchase'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756214322',
        firingTriggerId: ['121'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '135',
        name: 'GA4 event - view_item_list',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'view_item_list'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756265385',
        firingTriggerId: ['110'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '137',
        name: 'GA4 event - begin_checkout',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'begin_checkout'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756182430',
        firingTriggerId: ['136'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '148',
        name: 'GA4 event - refund',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'transaction_id'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.transaction_id}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.items}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'refund'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756221507',
        firingTriggerId: ['144'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '149',
        name: 'GA4 event - page_view',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_path'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - page_path}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_title'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - page_title}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_location'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - page_location}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'page_view'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756208006',
        firingTriggerId: ['120'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '150',
        name: 'GA4 event - view_item',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom] GA4 Items array}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'view_item'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756259487',
        firingTriggerId: ['143'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '155',
        name: 'GA4 event - select_item',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'value'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.value}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'currency'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - ecommerce.currency}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'items'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{[custom] GA4 Items array}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'select_item'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756241430',
        firingTriggerId: ['154'],
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '162',
        name: 'GA4 event - YouTube',
        type: 'gaawe',
        notes: 'video provider could be a variable.',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_provider'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: 'youtube'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_title'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Title}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_url'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video URL}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'video_percent'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{Video Percent}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: '{{Event}}'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756277434',
        firingTriggerId: ['180', '181', '182'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '165',
        name: 'Default Consent Tag',
        type: 'cvt_168785492_164',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'wait_for_update',
            value: '0'
          },
          {
            type: 'TEMPLATE',
            key: 'regions',
            value: 'all'
          },
          {
            type: 'BOOLEAN',
            key: 'sendDataLayer',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'command',
            value: 'default'
          },
          {
            type: 'TEMPLATE',
            key: 'functionality_storage',
            value: 'denied'
          },
          {
            type: 'BOOLEAN',
            key: 'url_passthrough',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'ad_storage',
            value: 'denied'
          },
          {
            type: 'BOOLEAN',
            key: 'ads_data_redaction',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'ad_user_data',
            value: 'denied'
          },
          {
            type: 'TEMPLATE',
            key: 'security_storage',
            value: 'denied'
          },
          {
            type: 'TEMPLATE',
            key: 'personalization_storage',
            value: 'denied'
          },
          {
            type: 'TEMPLATE',
            key: 'analytics_storage',
            value: 'denied'
          },
          {
            type: 'TEMPLATE',
            key: 'ad_personalization',
            value: 'denied'
          }
        ],
        fingerprint: '1703141422194',
        firingTriggerId: ['2147479572'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '166',
        name: 'Update Consent Tag',
        type: 'cvt_168785492_164',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'ad_storage',
            value: '{{DLV - ad_storage}}'
          },
          {
            type: 'BOOLEAN',
            key: 'ads_data_redaction',
            value: 'true'
          },
          {
            type: 'BOOLEAN',
            key: 'sendDataLayer',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'ad_user_data',
            value: '{{DLV - ad_user_data}}'
          },
          {
            type: 'TEMPLATE',
            key: 'security_storage',
            value: 'denied'
          },
          {
            type: 'TEMPLATE',
            key: 'command',
            value: 'update'
          },
          {
            type: 'TEMPLATE',
            key: 'functionality_storage',
            value: 'denied'
          },
          {
            type: 'TEMPLATE',
            key: 'personalization_storage',
            value: 'denied'
          },
          {
            type: 'BOOLEAN',
            key: 'url_passthrough',
            value: 'true'
          },
          {
            type: 'TEMPLATE',
            key: 'analytics_storage',
            value: '{{DLV - analytics_storage}}'
          },
          {
            type: 'TEMPLATE',
            key: 'ad_personalization',
            value: '{{DLV - ad_personalization}}'
          }
        ],
        fingerprint: '1703247574108',
        firingTriggerId: ['171'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '178',
        name: 'Configuration Update (Update Consent)',
        type: 'googtag',
        priority: {
          type: 'INTEGER',
          value: '9999'
        },
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'tagId',
            value: '{{CONST - Measurement ID}}'
          },
          {
            type: 'LIST',
            key: 'configSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'allow_ad_personalization_signals'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{CJS - allow_ad_personalization_signals}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'allow_google_signals'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{CJS - allow_google_signals}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'send_page_view'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: 'false'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'debug_mode'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: 'false'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_referrer'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue'
                  }
                ]
              }
            ]
          }
        ],
        fingerprint: '1734756321000',
        firingTriggerId: ['171'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '184',
        name: 'CHTML - SPA manual scroll',
        type: 'html',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'html',
            value:
              '<script>\n    // IIFE to avoid global window pollution\n    var PageScrollTracker = (function () {\n        var dataLayer = window.dataLayer || [];\n        var pageScroll = {\n            min: 1.00,\n            sc25: false,\n            sc50: false,\n            sc75: false,\n            sc95: false,\n            sc2pg: true,\n            sclstop: 0\n        };\n\n        function init() {\n            resetPageScroll();\n            calculateMetrics();\n        }\n\n        function resetPageScroll() {\n            pageScroll = {\n                min: 1.00,\n                sc25: false,\n                sc50: false,\n                sc75: false,\n                sc95: false,\n                sc2pg: true,\n                sclstop: 0\n            };\n        }\n\n        function calculateMetrics() {\n            pageScroll.DocSize = getViewportHeight() / getDocumentHeight();\n            pageScroll.DocSizeName = getViewportHeight() / getDocumentHeight() < pageScroll.min ? "long-doc" : "test1-too-small";\n            pageScroll.DocPages = getDocumentHeight() / getViewportHeight();\n            pageScroll.DocCP = getCurrentPosition() / getDocumentHeight();\n            pageScroll.TooSmall = getViewportHeight() / getDocumentHeight() > pageScroll.min;\n        }\n\n        function getDocumentHeight() {\n            var selector = "div#__next > div";\n            var element = document.querySelector(selector);\n            if (element !== null) {\n                return element.offsetHeight;\n            } \n            return Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);\n        }\n\n        function getCurrentPosition() {\n            return window.pageYOffset + getViewportHeight();\n        }\n\n        function getViewportHeight() {\n            if (typeof window.innerHeight === "number") {\n                return window.innerHeight;\n            }\n            if (document.documentElement && document.documentElement.clientHeight) {\n                return document.documentElement.clientHeight;\n            }\n            if (document.body && document.body.clientHeight) {\n                return document.body.clientHeight;\n            }\n        }\n\n        function trackScroll() {\n            calculateMetrics();\n            if (getViewportHeight() / getDocumentHeight() > pageScroll.min) {\n                pageScroll.TooSmall = true;\n            } else {\n                pageScroll.TooSmall = false;\n                var isScrollingDown = getCurrentPosition() > pageScroll.sclstop;\n                pageScroll.sclstop = getCurrentPosition();\n                if (isScrollingDown) {\n                    checkScrollThresholdsAndPushEvents();\n                }\n            }\n        }\n\n        function checkScrollThresholdsAndPushEvents() {\n            var scrollThresholds = [\n                { name: "sc25", value: 0.25, pushed: false },\n                { name: "sc50", value: 0.50, pushed: false },\n                { name: "sc75", value: 0.75, pushed: false },\n                { name: "sc95", value: 1, pushed: false }\n            ];\n            scrollThresholds.forEach(function (threshold) {\n                var hasScrolledPastThreshold = getCurrentPosition() >= threshold.value * getDocumentHeight();\n                if (hasScrolledPastThreshold && !pageScroll[threshold.name]) {\n                    // can set the event name manually or pass it as function parameter\n                    dataLayer.push({ event: "CustomScroll", customScrollPercent: (threshold.value * 100) });\n                    pageScroll[threshold.name] = true;\n                }\n            });\n        }\n\n        return {\n            init: init,\n            trackScroll: trackScroll\n        };\n    })();\n\n    try {\n        PageScrollTracker.init();\n        window.onscroll = PageScrollTracker.trackScroll;\n    } catch (e) {\n        console.error("scroll plugin failed.", e);\n    }\n</script>\n'
          },
          {
            type: 'BOOLEAN',
            key: 'supportDocumentWrite',
            value: 'false'
          }
        ],
        fingerprint: '1704339037412',
        firingTriggerId: ['202', '203'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '187',
        name: 'GA4 event - scroll',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'percent_scrolled'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - customScrollPercent}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'scroll'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756233253',
        firingTriggerId: ['185'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '208',
        name: 'GA4 event - navigation_click',
        type: 'gaawe',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'sendEcommerceData',
            value: 'false'
          },
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'business_unit'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - business_unit}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'nav_category'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - nav_category}}'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'nav_label'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{DLV - nav_label}}'
                  }
                ]
              }
            ]
          },
          {
            type: 'BOOLEAN',
            key: 'enhancedUserId',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'eventName',
            value: 'navigation_click'
          },
          {
            type: 'TEMPLATE',
            key: 'measurementIdOverride',
            value: '{{CONST - Measurement ID}}'
          }
        ],
        fingerprint: '1734756202386',
        firingTriggerId: ['207'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '227',
        name: '[GA4] Cookie creator for Item list & Promotion attribution',
        type: 'cvt_168785492_226',
        priority: {
          type: 'INTEGER',
          value: '-1000'
        },
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'listClickEvent',
            value: 'select_item'
          },
          {
            type: 'TEMPLATE',
            key: 'purchaseEvent',
            value: 'purchase'
          },
          {
            type: 'TEMPLATE',
            key: 'promoClickEvent',
            value: 'select_promotion'
          },
          {
            type: 'TEMPLATE',
            key: 'addToCartEvent',
            value: 'add_to_cart'
          },
          {
            type: 'BOOLEAN',
            key: 'cookieExpirationCheckbox',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'detailViewEvent',
            value: 'view_item'
          },
          {
            type: 'TEMPLATE',
            key: 'dlType',
            value: 'ga4'
          },
          {
            type: 'BOOLEAN',
            key: 'productClickTracking',
            value: 'true'
          },
          {
            type: 'BOOLEAN',
            key: 'promoClickTracking',
            value: 'true'
          }
        ],
        fingerprint: '1710373714243',
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NEEDED',
          consentType: {
            type: 'LIST',
            list: [
              {
                type: 'TEMPLATE',
                value: 'analytics_storage'
              }
            ]
          }
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        tagId: '234',
        name: 'Cookie creator tag',
        type: 'cvt_168785492_226',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'listClickEvent',
            value: 'select_item'
          },
          {
            type: 'TEMPLATE',
            key: 'purchaseEvent',
            value: 'purchase'
          },
          {
            type: 'TEMPLATE',
            key: 'promoClickEvent',
            value: 'select_promotion'
          },
          {
            type: 'TEMPLATE',
            key: 'addToCartEvent',
            value: 'add_to_cart'
          },
          {
            type: 'BOOLEAN',
            key: 'cookieExpirationCheckbox',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'detailViewEvent',
            value: 'view_item'
          },
          {
            type: 'TEMPLATE',
            key: 'dlType',
            value: 'ga4'
          },
          {
            type: 'BOOLEAN',
            key: 'productClickTracking',
            value: 'true'
          },
          {
            type: 'BOOLEAN',
            key: 'promoClickTracking',
            value: 'true'
          }
        ],
        fingerprint: '1710376154019',
        firingTriggerId: ['130', '121', '154', '125', '143', '115'],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      }
    ],
    trigger: [
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '107',
        name: 'event equals add_shipping_info',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'add_shipping_info'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700572149'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '110',
        name: 'event equals view_item_list',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'view_item_list'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700711744'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '111',
        name: 'event equals add_payment_info',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'add_payment_info'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700554078'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '113',
        name: 'event equals remove_from_cart',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'remove_from_cart'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700655983'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '115',
        name: 'event equals view_promotion',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'view_promotion'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700500593'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '120',
        name: 'event equals page_view',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'page_view'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700602463'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '121',
        name: 'event equals purchase',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'purchase'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700621566'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '125',
        name: 'event equals select_promotion',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'select_promotion'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700514545'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '127',
        name: 'event equals view_cart',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'view_cart'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700681565'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '130',
        name: 'event equals add_to_cart',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'add_to_cart'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700923343918'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '136',
        name: 'event equals begin_checkout',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'begin_checkout'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700585524'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '143',
        name: 'event equals view_item',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'view_item'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700697403'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '144',
        name: 'event equals refund',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'refund'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700640182'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '154',
        name: 'event equals select_item',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'select_item'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1700700527255'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '159',
        name: 'All pages - none-app',
        type: 'PAGEVIEW',
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          },
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - analytics_consent}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'true'
              }
            ]
          }
        ],
        fingerprint: '1703249341205'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '161',
        name: 'event equals youtube',
        type: 'YOU_TUBE_VIDEO',
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1702127524038',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'progressThresholdsPercent',
            value: '10,25,50,75,90'
          },
          {
            type: 'BOOLEAN',
            key: 'captureComplete',
            value: 'true'
          },
          {
            type: 'BOOLEAN',
            key: 'captureStart',
            value: 'true'
          },
          {
            type: 'BOOLEAN',
            key: 'fixMissingApi',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'triggerStartOption',
            value: 'DOM_READY'
          },
          {
            type: 'TEMPLATE',
            key: 'radioButtonGroup1',
            value: 'PERCENTAGE'
          },
          {
            type: 'BOOLEAN',
            key: 'capturePause',
            value: 'false'
          },
          {
            type: 'BOOLEAN',
            key: 'captureProgress',
            value: 'true'
          }
        ]
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '171',
        name: 'event equals update_consent',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'update_consent'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1703398229606'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '180',
        name: 'event equals youtube_start',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'youtube_start'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1703386684747'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '181',
        name: 'event equals youtube_progress',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'youtube_progress'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1703386706684'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '182',
        name: 'event equals youtube_complete',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'youtube_complete'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1703386722366'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '185',
        name: 'event equals CustomScroll',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'CustomScroll'
              }
            ]
          }
        ],
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          },
          {
            type: 'CONTAINS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{Activate scroll tracking}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: '25'
              }
            ]
          },
          {
            type: 'CONTAINS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{Activate scroll tracking}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: '50'
              }
            ]
          },
          {
            type: 'CONTAINS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{Activate scroll tracking}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: '75'
              }
            ]
          },
          {
            type: 'CONTAINS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{Activate scroll tracking}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: '100'
              }
            ]
          }
        ],
        fingerprint: '1704291744015'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '188',
        name: 'event equals to history change',
        type: 'HISTORY_CHANGE',
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1703396316362'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '191',
        name: 'Window loaded',
        type: 'WINDOW_LOADED',
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          }
        ],
        fingerprint: '1703397254698'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '193',
        name: 'Initialization - All Pages',
        type: 'INIT',
        filter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - isWithinApp}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'null'
              }
            ]
          },
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{CJS - analytics_consent}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'true'
              }
            ]
          }
        ],
        fingerprint: '1703651460694'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '201',
        name: 'event equals componentLoaded',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'componentsLoaded'
              }
            ]
          }
        ],
        fingerprint: '1704339913131'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '202',
        name: 'history change (componentsLoaded)',
        type: 'TRIGGER_GROUP',
        fingerprint: '1704339926499',
        parameter: [
          {
            type: 'LIST',
            key: 'triggerIds',
            list: [
              {
                type: 'TRIGGER_REFERENCE',
                value: '188'
              },
              {
                type: 'TRIGGER_REFERENCE',
                value: '201'
              }
            ]
          }
        ]
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '203',
        name: 'windowLoaded (componentsLoaded)',
        type: 'TRIGGER_GROUP',
        fingerprint: '1704339935510',
        parameter: [
          {
            type: 'LIST',
            key: 'triggerIds',
            list: [
              {
                type: 'TRIGGER_REFERENCE',
                value: '191'
              },
              {
                type: 'TRIGGER_REFERENCE',
                value: '201'
              }
            ]
          }
        ]
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        triggerId: '207',
        name: 'event equals navigation_click',
        type: 'CUSTOM_EVENT',
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}'
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: 'navigation_click'
              }
            ]
          }
        ],
        fingerprint: '1705123664834'
      }
    ],
    variable: [
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '108',
        name: 'Measurement ID',
        type: 'remm',
        parameter: [
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'true'
          },
          {
            type: 'TEMPLATE',
            key: 'input',
            value: '{{Page URL}}'
          },
          {
            type: 'BOOLEAN',
            key: 'fullMatch',
            value: 'false'
          },
          {
            type: 'BOOLEAN',
            key: 'replaceAfterMatch',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'defaultValue',
            value: 'G-1'
          },
          {
            type: 'BOOLEAN',
            key: 'ignoreCase',
            value: 'true'
          },
          {
            type: 'LIST',
            key: 'map',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'key',
                    value:
                      'wodenwang820118\\.github\\.io\\/ng-gtm-integration-sample'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'value',
                    value: 'G-8HK542DQMG'
                  }
                ]
              },
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'key',
                    value: 'gtm-integration-sample\\.netlify\\.app'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'value',
                    value: 'G-8HK542DQMG'
                  }
                ]
              }
            ]
          }
        ],
        fingerprint: '1712222345673',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '112',
        name: 'DLV - ecommerce.coupon',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.coupon'
          }
        ],
        fingerprint: '1697678137070'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '117',
        name: 'DLV - ecommerce.value',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.value'
          }
        ],
        fingerprint: '1697678137071'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '118',
        name: 'DLV - page_location',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'page_location'
          }
        ],
        fingerprint: '1697678137071'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '122',
        name: 'DLV - ecommerce.promotion_id',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.promotion_id'
          }
        ],
        fingerprint: '1697678137073'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '123',
        name: 'DLV - ecommerce',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce'
          }
        ],
        fingerprint: '1697678137073'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '124',
        name: 'DLV - ecommerce.payment_type',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.payment_type'
          }
        ],
        fingerprint: '1697678137073'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '129',
        name: 'DLV - ecommerce.promotion_name',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.promotion_name'
          }
        ],
        fingerprint: '1697678137074'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '134',
        name: 'DLV - ecommerce.items',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.items'
          }
        ],
        fingerprint: '1697678137076'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '138',
        name: 'DLV - ecommerce.tax',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.tax'
          }
        ],
        fingerprint: '1697678137077'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '139',
        name: 'DLV - page_title',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'page_title'
          }
        ],
        fingerprint: '1697678137077'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '140',
        name: 'DLV - page_path',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'page_path'
          }
        ],
        fingerprint: '1697678137077'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '141',
        name: 'DLV - ecommerce.shipping_tier',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.shipping_tier'
          }
        ],
        fingerprint: '1697678137077'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '142',
        name: 'DLV - ecommerce.transaction_id',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.transaction_id'
          }
        ],
        fingerprint: '1697678137078'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '145',
        name: 'DLV - ecommerce.shipping',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.shipping'
          }
        ],
        fingerprint: '1697678137078'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '146',
        name: 'DLV - ecommerce.creative_slot',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.creative_slot'
          }
        ],
        fingerprint: '1697678137079'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '147',
        name: 'DLV - ecommerce.affiliation',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.affiliation'
          }
        ],
        fingerprint: '1697678137079'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '151',
        name: 'DLV - ecommerce.creative_name',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.creative_name'
          }
        ],
        fingerprint: '1697678137160'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '153',
        name: 'DLV - ecommerce.currency',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ecommerce.currency'
          }
        ],
        fingerprint: '1697678933075'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '160',
        name: 'CJS - isWithinApp',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              'function() {\n  var url = new URL(document.location.href);\n  return url.searchParams.get("app_source") ? url.searchParams.get("app_source"): null;\n}'
          }
        ],
        fingerprint: '1700642110794',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '167',
        name: 'DLV - ad_storage',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ad_storage'
          }
        ],
        fingerprint: '1703141720781',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '168',
        name: 'DLV - analytics_storage',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'analytics_storage'
          }
        ],
        fingerprint: '1703141835327',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '169',
        name: 'DLV - ad_user_data',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ad_user_data'
          }
        ],
        fingerprint: '1703141857437',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '170',
        name: 'DLV - ad_personalization',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'ad_personalization'
          }
        ],
        fingerprint: '1703141880835',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '173',
        name: 'CJS - analytics_consent',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n  var consent = JSON.parse(localStorage.getItem('consentPreferences'));\n  var analytics_storage = consent.analytics_storage;\n  var ad_storage = consent.ad_storage;\n  var ad_user_data = consent.ad_user_data;\n  var ad_personalization = consent.ad_personalization;\n  return ad_storage && analytics_storage && ad_user_data;\n}"
          }
        ],
        fingerprint: '1703249525961',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '176',
        name: 'CJS - allow_ad_personalization_signals',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n  var consent = JSON.parse(localStorage.getItem('consentPreferences'));\n  var ad_personalization = consent.ad_personalization;\n  return ad_personalization;\n}"
          }
        ],
        fingerprint: '1703253619179',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '177',
        name: 'CJS - allow_google_signals',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n  var consent = JSON.parse(localStorage.getItem('consentPreferences'));\n  var ad_storage = consent.ad_storage;\n  var ad_user_data = consent.ad_user_data;\n  var ad_personalization = consent.ad_personalization;\n  return ad_storage && ad_user_data && ad_personalization;\n}"
          }
        ],
        fingerprint: '1703253733708',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '186',
        name: 'DLV - customScrollPercent',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'customScrollPercent'
          }
        ],
        fingerprint: '1703395694868',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '189',
        name: 'CJS - scroll handler',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              'function() {\n  // rules\n  // 1. on normal page, customScrollPercent will be undefined\n  // so, it will return normal Scroll Depth Threshold with GTM scroll trigger\n  // 2. on SPA page, custom scroll mechanism will be activated\n  // but Scroll Depth Threshold could be any value updated from previous page\n  // so using customScrollPercent in the first place\n  // please see CHTML - SPA manual scroll for more information\n  return {{DLV - customScrollPercent}} || {{Scroll Depth Threshold}};\n}'
          }
        ],
        fingerprint: '1703396758107',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '194',
        name: 'page_referrer for G-8HK542DQMG Tags | String',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n  try {\n    var containerId = {{Container ID}}\n      , gtm = window.google_tag_manager[containerId]\n      , measurementId = 'G-ABCD123' // Change to your Measurement ID.\n      , navigationType = performance.getEntriesByType('navigation')[0].type\n      , referrer = {{Referrer}};\n\n    var referrerSanitized = function() {\n      var ret = referrer;\n      if (gtm.dataLayer.get('ga4HitSent' + measurementId) || navigationType !== 'navigate') ret = '';\n      gtm.dataLayer.set('ga4HitSent' + measurementId, true);\n      return ret;\n    };\n    return referrerSanitized();\n  } catch(e) { return {{Referrer}}; }\n}"
          }
        ],
        fingerprint: '1703734375346',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '195',
        name: 'Google Tag G-8HK542DQMG Event Settings',
        type: 'gtes',
        parameter: [
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: [
              {
                type: 'MAP',
                map: [
                  {
                    type: 'TEMPLATE',
                    key: 'parameter',
                    value: 'page_referrer'
                  },
                  {
                    type: 'TEMPLATE',
                    key: 'parameterValue',
                    value: '{{page_referrer for G-8HK542DQMG Tags | String}}'
                  }
                ]
              }
            ]
          }
        ],
        fingerprint: '1703652484999'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '196',
        name: 'Activate scroll tracking',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n  // Change this to reflect the percentages or pixels you want to fire the trigger for\n  var verticalScrollDepths = '25,50,75,100';\n  \n  // Change this to the MAXIMUM ratio of viewport height / page height you want the trigger to activate for\n  var maximumRatio = 0.25;\n  \n  // Change this to what thresholds should be tracked if the ratio is more than the maximum\n  // Leave it at '101' if you want to prevent the trigger from functioning in this case\n  var fallbackDepths = '101';\n  \n  var heightOfPage = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);\n  \n  var heightOfViewport = Math.max(document.documentElement.clientHeight, window.innerHeight);\n  \n  var ratio = heightOfViewport / heightOfPage;\n  \n  return ratio < maximumRatio ? verticalScrollDepths : fallbackDepths;\n}"
          }
        ],
        fingerprint: '1704291713033',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '204',
        name: 'DLV - nav_category',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'nav_category'
          }
        ],
        fingerprint: '1705123664832'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '205',
        name: 'DLV - business_unit',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'business_unit'
          }
        ],
        fingerprint: '1705123664833'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '206',
        name: 'DLV - nav_label',
        type: 'v',
        parameter: [
          {
            type: 'INTEGER',
            key: 'dataLayerVersion',
            value: '2'
          },
          {
            type: 'BOOLEAN',
            key: 'setDefaultValue',
            value: 'false'
          },
          {
            type: 'TEMPLATE',
            key: 'name',
            value: 'nav_label'
          }
        ],
        fingerprint: '1705123664833'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '229',
        name: '[custom] GA4 Items array',
        type: 'cvt_168785492_228',
        fingerprint: '1710373714244',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '230',
        name: '[custom JS] promo - promotion_id',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function () {\n  var cookie = {};\n  document.cookie.split(';').forEach(function(el) {\n    var k = el.split('=')[0];\n    var v =el.split('=')[1];\n    cookie[k.trim()] = v;\n  });\n  var promotion_id = decodeURIComponent(cookie['ga4_promo']).split('//')[0];\n  \n  if (promotion_id === 'undefined') {\n    return undefined;\n  } else {\n    return promotion_id;\n  }\n}\n"
          }
        ],
        fingerprint: '1710373714245',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '231',
        name: '[custom JS] promo - creative_name',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function () {\n  var cookie = {};\n  document.cookie.split(';').forEach(function(el) {\n    var k = el.split('=')[0];\n    var v =el.split('=')[1];\n    cookie[k.trim()] = v;\n  });\n  var creative_name = decodeURIComponent(cookie['ga4_promo']).split('//')[2];\n  \n  if (creative_name === 'undefined') {\n    return undefined;\n  } else {\n    return creative_name;\n  }\n}\n"
          }
        ],
        fingerprint: '1710373714245',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '232',
        name: '[custom JS] promo - creative_slot',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function () {\n  var cookie = {};\n  document.cookie.split(';').forEach(function(el) {\n    var k = el.split('=')[0];\n    var v =el.split('=')[1];\n    cookie[k.trim()] = v;\n  });\n  var creative_slot = decodeURIComponent(cookie['ga4_promo']).split('//')[3];\n  \n  if (creative_slot === 'undefined') {\n    return undefined;\n  } else {\n    return creative_slot;\n  }\n}\n"
          }
        ],
        fingerprint: '1710373714245',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '233',
        name: '[custom JS] promo - promotion_name',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function () {\n  var cookie = {};\n  document.cookie.split(';').forEach(function(el) {\n    var k = el.split('=')[0];\n    var v =el.split('=')[1];\n    cookie[k.trim()] = v;\n  });\n  var promotion_name = decodeURIComponent(cookie['ga4_promo']).split('//')[1];\n  \n  if (promotion_name === 'undefined') {\n    return undefined;\n  } else {\n    return promotion_name;\n  }\n}\n"
          }
        ],
        fingerprint: '1710373714246',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '236',
        name: 'CJS - page_load_time',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n    if (window.performance && window.performance.getEntriesByType) {\n      var entries = window.performance.getEntriesByType('navigation');\n      if (entries.length > 0) {\n        var navTiming = entries[0];\n        var pageLoadTime = navTiming.loadEventEnd - navTiming.startTime;\n        return Math.round((pageLoadTime / 1000 + Number.EPSILON) * 1000);\n      }\n    } \n    // Indicates that the browser does not support the Navigation Timing API\n    return -1;\n}"
          }
        ],
        fingerprint: '1712820512504',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '238',
        name: 'CJS - route_change_time',
        type: 'jsm',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'javascript',
            value:
              "function() {\n    if (window.performance && window.performance.getEntriesByType) {\n       var resources = window.performance.getEntriesByType('resource');\n       var latestResourceLoadTime = 0;\n\n       for (var i = 0; i < resources.length; i++) {\n         var resource = resources[i];\n         // console.log('resource name: ' + resource.name);\n         var loadingTime = resource.responseEnd - resource.fetchStart;\n         latestResourceLoadTime += loadingTime;\n       }\n\n       return Math.round(\n         (latestResourceLoadTime / 1000 + Number.EPSILON) * 1000\n       );\n     }\n\n    // Indicates that the browser does not support the Resource Timing API\n    return -1;\n}"
          }
        ],
        fingerprint: '1717994333232',
        formatValue: {}
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        variableId: '274',
        name: 'CONST - Measurement ID',
        type: 'c',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'value',
            value: 'G-8HK542DQMG'
          }
        ],
        fingerprint: '1734756121031',
        formatValue: {}
      }
    ],
    builtInVariable: [
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'PAGE_URL',
        name: 'Page URL'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'PAGE_HOSTNAME',
        name: 'Page Hostname'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'PAGE_PATH',
        name: 'Page Path'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'REFERRER',
        name: 'Referrer'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'EVENT',
        name: 'Event'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'NEW_HISTORY_FRAGMENT',
        name: 'New History Fragment'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'OLD_HISTORY_FRAGMENT',
        name: 'Old History Fragment'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'CONTAINER_ID',
        name: 'Container ID'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_PROVIDER',
        name: 'Video Provider'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_URL',
        name: 'Video URL'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_TITLE',
        name: 'Video Title'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_DURATION',
        name: 'Video Duration'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_PERCENT',
        name: 'Video Percent'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_VISIBLE',
        name: 'Video Visible'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_STATUS',
        name: 'Video Status'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'VIDEO_CURRENT_TIME',
        name: 'Video Current Time'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        type: 'SCROLL_DEPTH_THRESHOLD',
        name: 'Scroll Depth Threshold'
      }
    ],
    fingerprint: '1755843254842',
    tagManagerUrl:
      'https://tagmanager.google.com/#/versions/accounts/6140708819/containers/168785492/versions/0?apiLink=version',
    customTemplate: [
      {
        accountId: '6140708819',
        containerId: '168785492',
        templateId: '164',
        name: 'Consent Mode (Google + Microsoft tags)',
        fingerprint: '1734756721544',
        templateData:
          '___TERMS_OF_SERVICE___\n\nBy creating or modifying this file you agree to Google Tag Manager\'s Community\nTemplate Gallery Developer Terms of Service available at\nhttps://developers.google.com/tag-manager/gallery-tos (or such other URL as\nGoogle may provide), as modified from time to time.\n\n\n___INFO___\n\n{\n  "type": "TAG",\n  "id": "cvt_temp_public_id",\n  "__wm": "VGVtcGFsdGUtQXV0aG9yX0NvbnNlbnRNb2RlLVNpbW8tQWhhdmE\\u003d",\n  "version": 1,\n  "securityGroups": [],\n  "displayName": "Consent Mode (Google + Microsoft tags)",\n  "categories": [\n    "UTILITY",\n    "ANALYTICS",\n    "ADVERTISING"\n  ],\n  "brand": {\n    "id": "github.com_gtm-templates-simo-ahava",\n    "displayName": "gtm-templates-simo-ahava",\n    "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAA7tAAAO7QHxzsUOAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAuVQTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuQ1fLAAAAPZ0Uk5TAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZYWVtcXl9gYWJjZGVmZ2hpamxtbm9wcXJzdHV2d3h5ent9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5WWl5iZmpucnZ6foKGio6Wmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+mktelAAAEr1JREFUeNrtnXucT2Uex5/fzBiXYUSiNVKkUBO6qIQZFrm0pS2kWusSNdUwlUtSFIPGliI2pbaoDeuaLsZda11qk0SbVsMwJOMyDDPP3/uHtrwyZp5zzvN9rp/33+d3nmee9/v1m/M75/zOjzEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADOUi21Z7+M4eOmzHxn4acr/SZ36dyZOc8OG9Snxy21PDBfpVWvEa+vyivloAz2r3ots1ujOFflJ3Ueu/okLFdI0ebJXaq4Jr9G9+wNp+FWPIKPsq6LOWM/sef7RXAamH1v9a7sgP1Y2ozDkBmSgznNLdffLHsPNEZi3Z+q2av/xnk43I/OkWnX26k//SPIk8R7Kfbp77EO3uRR2NEy/Z0/hzSpHE+3SX/9uTAmmx+qW6M/IbMQvuQz3hb/t30BWRTk23FmsM4sfPIj4mYb/LfPgygqBltw2nfEGXgiY5Tx/i9eCkuETDDdfxuc9idloOFv/1m43k/LLWZf858DQ7R8E+lWsYt6DBz96vxlb4x/tHdTCv/VP4YhYgaEt9Mkc8W5b887czokyP70vxGCiFkZ2lm79efvrSAzUab/hl9DEDF59UK6abqg7B3+p4+8M4vNcfhPzYHUkNdlci58aL6xiST/txyCIGr/14Y89Cv30OyQnEvMbY9BkKH+G28vf7/FAyT4T8U9v6b6b1NQ4a4nRz4QaLQXgojZf03It+ajAjt/NWIBdXdCkM3+oxaQvAWC7PYfrYDKuRBE7b85sf8oBcTPgyBi8un9RyhgHAS54D90Abfj7j9q/82U+A9ZQEoBDDniP1QBCWtgyBn/YQrIhiFa9qn0H7yAHjgAIPbfVKn/oAU0lHMFsHDnmg/meM7idV/lnzpvZVZcpth/wAKWRRT/wbND7m7T2OJnX0gmqWHXUR9898v6nBwWU+4/UAH3RLH/3dQuiVBeFrU7PTl/P9+3cHTYJwNF8h+ggKTQtwCVrB9xLUSXX0GEWzOORvyXLFrAxJD7P5R1CQTTEdm/aAHXhPsKyInxNSHJbP+CBawKs+czM1PgyHj/QgU8EGa/85tBESntjko6AVFhAVXzg+90QxsYssR/xQU8EnyX0xJgyBr/FRVQ6fvA//0zIMgm/xUU0C/o3n7qAkF2+S+3gLgdAfe1sykE2ea/vAJ6B9xTbm0Iss9/OQVsDbafGZUgyEb/Fyyge7C9/AV+LPV/oQIWBdrH0ngIstV/2QVcXBxkD9uSIche/2UWMCTI6wsaQ5DN/ssqYG2AVxe3hyC7/Z9fwBVB7gT9MwTZ7v+8AkYGeOlkCLLf/28L2Cb+wmVxMOSAf86nnjNkS/GXncIBoBv+OX/s1zFHib/qZRhyxD8/0+2XQZeL3/ePmz9d8c/5kf/fpJ4gPujTUOSMf853/fxj9q2FX5GfBEfu+Of8ibPDZgm/YAgcueSfHz57TX+h6Pbf4BZAUv/qH82awxhjcT+Kbt4Lktzyz081YIy1EN06LwZLbvnnPIMxNkh049dgyTX//GPG2CTRje+AJtf88+JkxuaLfge0Kjy55p/zXox9KbjpInhyzz+fwmInBDcdBFHu+edzWAPBLUvrw5R7/vkqli645SaYctA/38EGCG75DFQ56J8XsgmCW94OVw7658fZLMEtW0CWg/75Lvae4Jb1YMtB/3wtWyK2YQluBpVPe/0/zfi+6KPB8qHLRf98KtsktuHn8OWif/4gE/yB8A8hzEX/JXWY4OOBZ8OYg/75WsYEfyI4G8oc9M+fYkzwyQCZcOag/5KrGBPcdDCkueefv8kQgM/+TzRAAD775+MZAvDZ//6aCMBn/z8/6wcBeOqf92cIwGf/UxgC8Nn/4ngE4LP/ZZUZAoB/BAD/CMBz/wjAc/8IwHP/CMBz/wjAc/8IwHP/CMBz/wjAc/8IwHP/CMBz/wjAc/8IwHP/CMBz/wjAc/8IwHP/CMBz/wjAc/8IgIo0O/wjAM/9IwDP/SMAz/0jAM/9IwDP/SMAz/0jAM/9IwDP/SMAz/0jAM/9IwDP/SMAz/0jAM/9IwDP/SMAz/0jAM/9IwDP/SMAz/0jAM/9IwDP/RsRQKx+q64PPjHs/s7X1YP/SCwN7F9/AIldp/3w6zi7XmwfD/8K/esO4Kq3C3871MFXLoV/Zf71BnDJ1DJ/s+rYM0nwr8i/zgDihh+50HD7HoR/Nf41BpBc7u9WT0uAfxX+9QXQeFv5I35aG/4V+NcWQNrBiobc2RT+6f3rCqDryYrHPJAK/+T+NQUg4t/4ApzwrycAMf+GF+CGfy0BiPo3ugBH/OsIQNy/wQW44l9DAEH8G1tA2nFH/KsPIJh/Qwtwx7/yAIL6N7KAdHf8qw4guH8DC3DJv+IAwvg3rgCn/KsNIJx/wwpwy7/SAML6N6oAx/yrDCC8f4MKcM2/wgCi+DemAOf8qwsgmn9DCnDPv7IAovo3ogAH/asKILp/Awpw0b+iAGT4116Ak/7VBCDHv+YC3PSvJABZ/rUW4Kh/FQHI86+xAFf9KwhApn9tBTjrnz4Auf41FeCuf/IAZPvXUoDD/qkDkO9fQwEu+ycOgMK/8gKc9k8bAI1/xQW47Z80ACr/Sgtw3D9lAHT+FRbgun/CACj9KyvAef90AdD6V1SA+/7JAqD2r6QAD/xTBUDvX0EBPvgnCqDLSRXLQlyAOf6X0PmnCSD1qJqFIS3AD/8kAdTdrWppCAvwxD9FAJXXq1scsgJ88U8RwOsql4eoAG/8EwRws9oFIinAH/8EAazh1hfgkX/5AdylfJGkF+CTf+kBxG/nthfglX/pAbTTsVBSC+jglX/pAUzklhfgmX/pAWzndhfgm3/ZATTRtVySCvDOv+wAHuJWF+Cff9kBjOU2F+Chf9kBzOQWF+Cjf9kBLOb2FuClf9kBbOLWFuCnf9kBfM1tLcBT/7IDWM0tLcBX/7IDmMvtLMBb/7IDeIlbWYC//mUHMJzbWIDH/mUHcCe3sACf/csOIKnIvgK89i/9auASblsBfvuXHsBgblkBnvuXHkBKiV0F+O5f/k2hs7hNBXjvX34AKScsKgD+Cb4X8AK3pgD4pwggucCWAuCfJADWrcSOAuCfKAA2lNtQAPyTBaD2+8EhC4B/wgASVxtfAPxTBsBqfmZ4AfBPG4DpBcA/dQBmFwD/9AGYXAD8qwjA3ALgX00AphYA/6oCYMkmFmCO/8Um+Kf9xRADC+gI/woDMK8A+FcbgGkFwL/qAMwqAP7VB2BSAYPN8Z/IvAnAoAI4/OsIAAWY7F9FACjAYP9KAkAB5vpXEwAKMNa/ogBQgKn+VQWAAgz1rywAFGCmf3UBoAAj/SsMAAWY6F9lACx5A/yHoUZa1uynWifYH4DfBYT1X2vO2a/aFf7tSusD8LmAsP477vllF8UvV7c9AH8LCOt/TOm5e8mtansAvhYQ1v+E3+xneZztAfhZgCz/nPeyPgAfCwjrP/v8XW22PwD/CpDon/Om9gfgWwFS/fPuDgTgVwFh/V/gJzgfdiEAnwqQ7J8/40QA/hQQ1v+kC+1wjBsB+FKAdP/OBOBHAfL9uxOADwWE9T+Z+xCA+wVQ+HcpANcLIPHvVABuFxDW/4vcnwBcLoDIv2MBuFtAWP853K8AXC2AzL9zAbhZAJ1/9wJwsYCw/qdwHwNwr4Cw/h/hfgbgWgGLQvq/8pivAbDk9fDPYiu5twG4VEBY/6wT9zgAdwoI7Z896XUArhQQ3j97x+8A3Cgggn+2zfMAXCggin+W73sA9hcQyT8CsL6AaP4RAGOsxnp//SMAywuI6h8B2F1AZP8IwOoCovtHADYXIME/ArC4ABn+EYC9BUjxjwCsLUCOfwRgawGS/CMASwuQ5R8B2FmANP8IwMoC5PlHADYWINE/ArCwAJn+EYB9BUj1jwCsK0CufwRQVgHr/PGPACwrQLZ/BGBXAdL9IwCrCpDvHwHYVACBfwRgUQEU/hGAPQWQ+EcA1hRA4x8B2FIAkX8EYEkBVP4RgB0FkPlHAFYUQOcfAdhQAKF/BGBBAZT+EYD5BZD6RwDGF0DrHwGYXsBCWv8IwPACqP0jALMLIPePAIwugN4/AjC5AAX+EYDBBajwjwDMLUCJfwRgbAFq/CMAUwtQ5B8BBCpgrXP+EYCZBSjzjwCMLECdfwRgYgEK/SMAAwtQ6R8BmFeAUv8IwLgC1PpHAKYVoNg/AjCsANX+EYBZBSj3jwDCUX2tI/4RgEkFaPCPAAwqQId/BGBOAVr8IwBjCtDjHwGYUoAm/wjAkAJ0+UcAZhSgzT8CMKIAff4RgAkFaPSPAAwoQKd/BKC/AK3+EYD2AvT6RwC6C9DsHwFIKWCNtf4RgN4CtPtHAFoL0O8fAegswAD/CEBjASb4RwD6CjDCPwLQVoAZ/hGArgL+YYZ/BKCpAFP8IwA9BRjjX1cAxWLDDmVuFmCOf1YoZmKk5GEPiw07kTlZgEH+qwm+ZT0medw9YsPOZvYVsLjCv+otc/yzRoIB9Jc87tdiwy63LwAWl1P+31Q60qTZ3ioYQB/J424SG/YLZiMDyzvCOf5Ho+Z6t2AAd0ged5XYsPlWBsDSLvwGt7mVWVMdLBhAB8njLhEbtiTezgISHj5Q5t+z+/6YYTMdIxjATZLHfU9w3EuZpSQ/f+i8PyYvq7Jx85wuKKK55HFnCY7bkllLfPtJ5/4n2PLsjTEDZ7lAUERDyeNOEBy3K7Oay9P6PJ792gsZvdr+ztAZfibmobSq5HEHCAbwHAOk54GKxDz8IHvgdMEAtsIRKXcJelgpe+AGolfNGkASJTMFNfxV9sCxE45eD7SL2D5BDcOlD/2l4MhLYImQm0TfiO+VPvR8wZGLqkETHc+JBtBC+tCTRIe+C5ro2Cpqobr0oQeJDj0TmsgQPhTfK3/sFqJj74tBFBVDRCXMlz923I+ig98HUUTEfyXq4HGC0ReKDv5tIlTRMFD4HubrCUbPEh79UagiodpeUQNHKK7KtxYO4EANyKJglLCBpRTDJxwVHh9XhCioc0RYwFMkE1guPP6xetAln5fEv8Z2q+Z3IP4qdEmncbHw8h+vRDKDluIBnL4KwmTzrvjyLyCawjbxKXwSD2Ny6Voqvvq9iOYwMsCXqadCmVSa/SS+9keqEE3iigAR8iGQJpHauwIs/Rtk0wjyfMXTv4c2eR/BVwR5lEknsnkMCTKNH6+GOFlMD7Lwe+PI5nFxcZCJ7KgFc3LICPQsoxzCmSwKNJNPEuBOBp3PBFr2Gwin0j3Yc9WmQZ4Emh4OtOgbSSezNVgBsyvDX1TaFwRb856ks+kd8NmK6+rCYDT6Fwdb8S9pb8iK2xGwgN2pcBiB+Jygj7PtSzyjfkEndPQP0Bia5KVBl/tb6nPwlb4POqWSJyAyJI23BV1s/hD5pB4JPCc+CzcJhiLtYOClzqM/6q6aH7yAzemwGZiLJhYHX+lMBRN7gIdgCY4Fg1F52KEQy7xdyXvtqjAFlLxxGawKE7t/d5hFlv5osLK55nSoyRVlXwSzYnTaEmqF+duK5jcx3PT4oaxLILfiUy1tl4dc38Oq7sVN2hNyhrxkw6iWUFwONXvPLgi7uArvwbmHR2DP9DuqwnRZXD10RXGEhd0Yp26qy3gkTizOzryvY/PacH72iL9h6zsHPj39m2iLWnKDwik3PMRlcGrPv5Ys8JyV2w9LWUs+Vmm0PUo5MIpcxTfiZ2PJjSJf9UOaE9Zg0Q2ipKPyI5eUAiy7OYzWcOx6Ow4DjOHjOB2fXsZh4Q1hr54b7+LnYemN4OhNuk5g5GLxDeBUZ22nsJK3YPn1fwDorfEkZt2dEKCbh7Wexm60Fwb0MobpJfUwHOjkFe2XstoegwV9vBunPQB280F40MUMIx7F1Oy/MKGH5w25oaHBNrjQQOljxtzSUnsDdCinuC8zh2pLIUQxx7sZdVtbwmwoUcrBW5lhZJyCFXX883Lz7m1tvRteVPFSJWYgtRbBjBKO3MvMJPbkadihZ2sTc7/i0C4PfsjP/lVhBlNnFu4UJOX7nsxwbvsCluhO/kyw4JeZEzILYYqG3GZ2fNmx/ly4ImBfX2YNnT+HL8kUTanJbKLHOjiTSOEE+36JL/0jeJPEwaftfLzSjfPwmVACeZlJzFaaZe+BwEicXtbX7uesxtJm4L7h0HyW4cLj9hN7vl8El8HZMfpK5go1umdvwIWiAOydM6Q5c4ykzmNXn4Taivludv8mzFGqtOo14vVVefhwUCbH/z1/0qCOKcx9qqX27JcxfNyUme8s/HSl3+R++Pc3X8kePfShvmkpMQYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI8T/pByEHqDxYVAAAAABJRU5ErkJggg\\u003d\\u003d"\n  },\n  "description": "Adjust tag behavior based on consent. This template utilizes the Consent API and can be used to adjust how Microsoft and Google\\u0027s advertising tools use cookies and process ad identifiers.",\n  "containerContexts": [\n    "WEB"\n  ]\n}\n\n\n___TEMPLATE_PARAMETERS___\n\n[\n  {\n    "type": "SELECT",\n    "name": "command",\n    "displayName": "Consent Command",\n    "selectItems": [\n      {\n        "value": "default",\n        "displayValue": "Default"\n      },\n      {\n        "value": "update",\n        "displayValue": "Update"\n      }\n    ],\n    "simpleValueType": true,\n    "help": "\\u003cstrong\\u003eDefault\\u003c/strong\\u003e means that you establish consent settings the site falls back on until such a time that the Update command is executed. You can have multiple Default tags on the page, each corresponding to a different region, for example.\\n\\u003cstrong\\u003eUpdate\\u003c/strong\\u003e is what you\\u0027d use once you\\u0027ve retrieved a consent status from the user.",\n    "defaultValue": "default",\n    "alwaysInSummary": true\n  },\n  {\n    "type": "TEXT",\n    "name": "wait_for_update",\n    "displayName": "Wait for Update",\n    "simpleValueType": true,\n    "valueUnit": "milliseconds",\n    "defaultValue": 0,\n    "help": "How long to wait (in milliseconds) for an \\u003cstrong\\u003eUpdate\\u003c/strong\\u003e command before firing Google tags that have been queued up.",\n    "enablingConditions": [\n      {\n        "paramName": "command",\n        "paramValue": "default",\n        "type": "EQUALS"\n      }\n    ],\n    "valueValidators": [\n      {\n        "type": "NON_NEGATIVE_NUMBER"\n      }\n    ]\n  },\n  {\n    "type": "CHECKBOX",\n    "name": "eea",\n    "checkboxText": "Include EEA regions",\n    "simpleValueType": true,\n    "help": "Check this box to apply this tag only to visitors from the European Economic Area.",\n    "defaultValue": false,\n    "enablingConditions": [\n      {\n        "paramName": "command",\n        "paramValue": "default",\n        "type": "EQUALS"\n      }\n    ]\n  },\n  {\n    "type": "TEXT",\n    "name": "regions",\n    "displayName": "Regions",\n    "simpleValueType": true,\n    "defaultValue": "all",\n    "help": "Apply this setting to users from these \\u003ca href\\u003d\\"https://en.wikipedia.org/wiki/ISO_3166-2\\"\\u003eregions\\u003c/a\\u003e (provide a comma-separated list). If you type \\u003cstrong\\u003eall\\u003c/strong\\u003e, the setting will apply to all users. If you type \\u003cstrong\\u003eeea\\u003c/strong\\u003e as one of the regions, the tag will automatically include all European Economic Area regions as geographical targets for this command.",\n    "enablingConditions": [\n      {\n        "paramName": "eea",\n        "paramValue": false,\n        "type": "EQUALS"\n      }\n    ],\n    "valueValidators": [\n      {\n        "type": "NON_EMPTY",\n        "errorMessage": "Set to \\"all\\" for all regions or add a comma-separated list of regions."\n      }\n    ]\n  },\n  {\n    "type": "TEXT",\n    "name": "regionsEEA",\n    "displayName": "Regions",\n    "simpleValueType": true,\n    "defaultValue": "eea",\n    "help": "Apply this setting to users from these \\u003ca href\\u003d\\"https://en.wikipedia.org/wiki/ISO_3166-2\\"\\u003eregions\\u003c/a\\u003e (provide a comma-separated list). If you type \\u003cstrong\\u003eall\\u003c/strong\\u003e, the setting will apply to all users. If you type \\u003cstrong\\u003eeea\\u003c/strong\\u003e as one of the regions, the tag will automatically include all European Economic Area regions as geographical targets for this command.",\n    "enablingConditions": [\n      {\n        "paramName": "eea",\n        "paramValue": true,\n        "type": "EQUALS"\n      }\n    ],\n    "valueValidators": [\n      {\n        "type": "NON_EMPTY",\n        "errorMessage": "Set to \\"all\\" for all regions or add a comma-separated list of regions."\n      }\n    ]\n  },\n  {\n    "type": "CHECKBOX",\n    "name": "platform_microsoft",\n    "checkboxText": "Enable Microsoft Consent Mode",\n    "simpleValueType": true,\n    "alwaysInSummary": false,\n    "defaultValue": false\n  },\n  {\n    "type": "GROUP",\n    "name": "settings",\n    "displayName": "Consent Settings",\n    "groupStyle": "ZIPPY_OPEN",\n    "subParams": [\n      {\n        "type": "GROUP",\n        "name": "require_both",\n        "displayName": "Required for Microsoft and Google services",\n        "groupStyle": "NO_ZIPPY",\n        "subParams": [\n          {\n            "type": "SELECT",\n            "name": "ad_storage",\n            "displayName": "ad_storage",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied",\n            "help": "If set to \\u003cstrong\\u003edenied\\u003c/strong\\u003e, Google and Microsoft\\u0027s advertising tags and pixels will not be able to read or write first-party cookies. The use of third-party cookies is limited to only spam and fraud detection purposes. \\u003ca href\\u003d\\"https://support.google.com/analytics/answer/9976101#behavior\\"\\u003eMore information\\u003c/a\\u003e."\n          }\n        ]\n      },\n      {\n        "type": "GROUP",\n        "name": "required_google",\n        "displayName": "Required for Google services",\n        "groupStyle": "NO_ZIPPY",\n        "subParams": [\n          {\n            "type": "SELECT",\n            "name": "analytics_storage",\n            "displayName": "analytics_storage",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied",\n            "help": "If set to \\u003cstrong\\u003edenied\\u003c/strong\\u003e, Google Analytics tags will not read or write analytics cookies, and data collected to Google Analytics will not utilize persistent cookie identifiers (the identifiers are reset with every page load). \\u003ca href\\u003d\\"https://support.google.com/analytics/answer/9976101#behavior\\"\\u003eMore information\\u003c/a\\u003e."\n          },\n          {\n            "type": "SELECT",\n            "name": "ad_user_data",\n            "displayName": "ad_user_data",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied",\n            "help": "If set to \\u003cstrong\\u003edenied\\u003c/strong\\u003e, user data cannot be used with Google\\u0027s advertising solutions for audience building."\n          },\n          {\n            "type": "SELECT",\n            "name": "ad_personalization",\n            "displayName": "ad_personalization",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied",\n            "help": "If set to \\u003cstrong\\u003edenied\\u003c/strong\\u003e, data collected on this website will not be used for remarketing in Google\\u0027s advertising solutions."\n          }\n        ]\n      },\n      {\n        "type": "GROUP",\n        "name": "optional",\n        "displayName": "Other signals",\n        "groupStyle": "NO_ZIPPY",\n        "subParams": [\n          {\n            "type": "SELECT",\n            "name": "personalization_storage",\n            "displayName": "personalization_storage",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied"\n          },\n          {\n            "type": "SELECT",\n            "name": "functionality_storage",\n            "displayName": "functionality_storage",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied"\n          },\n          {\n            "type": "SELECT",\n            "name": "security_storage",\n            "displayName": "security_storage",\n            "macrosInSelect": true,\n            "selectItems": [\n              {\n                "value": "granted",\n                "displayValue": "granted"\n              },\n              {\n                "value": "denied",\n                "displayValue": "denied"\n              },\n              {\n                "value": "notset",\n                "displayValue": "Not set"\n              }\n            ],\n            "simpleValueType": true,\n            "defaultValue": "denied"\n          }\n        ]\n      }\n    ]\n  },\n  {\n    "type": "GROUP",\n    "name": "other",\n    "displayName": "Other Settings",\n    "groupStyle": "ZIPPY_OPEN",\n    "subParams": [\n      {\n        "type": "CHECKBOX",\n        "name": "url_passthrough",\n        "checkboxText": "Pass Ad Click Information Through URLs (url_passthrough)",\n        "simpleValueType": true,\n        "help": "Check this if you want internal links to pass advertising identifiers (\\u003cstrong\\u003egclid\\u003c/strong\\u003e, \\u003cstrong\\u003edclid\\u003c/strong\\u003e, \\u003cstrong\\u003egclsrc\\u003c/strong\\u003e, \\u003cstrong\\u003e_gl\\u003c/strong\\u003e, \\u003cstrong\\u003ewbraid\\u003c/strong\\u003e) in the link URL while waiting for consent to be granted. \\u003ca href\\u003d\\"https://developers.google.com/tag-platform/security/guides/consent#passthroughs\\"\\u003eRead more here\\u003c/a\\u003e."\n      },\n      {\n        "type": "CHECKBOX",\n        "name": "ads_data_redaction",\n        "checkboxText": "Redact Ads Data (ads_data_redaction)",\n        "simpleValueType": true,\n        "help": "If this is checked \\u003cstrong\\u003eand\\u003c/strong\\u003e ad_storage consent status is \\u003cstrong\\u003edenied\\u003c/strong\\u003e, Google\\u0027s advertising tags will drop all advertising identifiers from the requests, and traffic will be routed through cookieless domains."\n      },\n      {\n        "type": "CHECKBOX",\n        "name": "sendDataLayer",\n        "checkboxText": "Push dataLayer Event",\n        "simpleValueType": true,\n        "help": "When consent is set to \\"default\\", a dataLayer event with \\u003cstrong\\u003eevent: \\u0027gtm_consent_default\\u0027\\u003c/strong\\u003e is sent, together with all the consent states. When an \\"update\\" is fired, a dataLayer event with \\u003cstrong\\u003eevent: \\u0027gtm_consent_update\\u0027\\u003c/strong\\u003e is pushed together with details about the updated consent state."\n      }\n    ]\n  }\n]\n\n\n___SANDBOXED_JS_FOR_WEB_TEMPLATE___\n\nconst dataLayerPush = require(\'createQueue\')(\'dataLayer\');\nconst gtagSet = require(\'gtagSet\');\nconst log = require(\'logToConsole\');\nconst makeNumber = require(\'makeNumber\');\nconst makeTableMap = require(\'makeTableMap\');\nconst setDefaultConsentState = require(\'setDefaultConsentState\');\nconst updateConsentState = require(\'updateConsentState\');\n\nconst eeaRegions = [\n  "AT",\n  "BE",\n  "BG",\n  "HR",\n  "CY",\n  "CZ",\n  "DK",\n  "EE",\n  "FI",\n  "FR",\n  "DE",\n  "GR",\n  "HU",\n  "IE",\n  "IT",\n  "LV",\n  "LT",\n  "LU",\n  "MT",\n  "NL",\n  "PL",\n  "PT",\n  "RO",\n  "SK",\n  "SI",\n  "ES",\n  "SE",\n  "NO",\n  "IS",\n  "LI"\n];\n\nconst regions = data.regions || data.regionsEEA;\n  \n// Determine the command and the setting object\n\nconst consentApi = data.command === \'default\' ? setDefaultConsentState : updateConsentState;\n\nconst settingsObject = {};\n\nif (data.ad_storage !== \'notset\') settingsObject.ad_storage = data.ad_storage;\nif (data.analytics_storage !== \'notset\') settingsObject.analytics_storage = data.analytics_storage;\nif (data.ad_user_data !== \'notset\') settingsObject.ad_user_data = data.ad_user_data;\nif (data.ad_personalization !== \'notset\') settingsObject.ad_personalization = data.ad_personalization;\nif (data.personalization_storage !== \'notset\') settingsObject.personalization_storage = data.personalization_storage;\nif (data.functionality_storage !== \'notset\') settingsObject.functionality_storage = data.functionality_storage;\nif (data.security_storage !== \'notset\') settingsObject.security_storage = data.security_storage;\n\n\n// Settings specific to the "default" command\nif (data.command === \'default\' && makeNumber(data.wait_for_update) > 0) {\n  settingsObject.wait_for_update = makeNumber(data.wait_for_update);\n}\n\nif (data.command === \'default\' && regions !== \'all\') {\n  let setRegions = regions.split(\',\').map(r => r.trim());\n  // Check if EEA regions are included\n  if (setRegions.indexOf(\'eea\') > -1) {\n    setRegions = setRegions.concat(eeaRegions);\n    // Remove duplicates & eea\n    setRegions = setRegions.filter((val, idx) => setRegions.indexOf(val) === idx && val !== \'eea\');\n  }\n  settingsObject.region = setRegions;\n}\n  \n// Set advanced settings\ngtagSet({\n  url_passthrough: data.url_passthrough || false,\n  ads_data_redaction: data.ads_data_redaction || false\n});\n\n// Set the consent state\nconsentApi(settingsObject);\n\nif (data.platform_microsoft) {\n  require(\'createQueue\')(\'uetq\')(\'consent\', data.command, {    \n    \'ad_storage\': data.ad_storage\n  });\n}\n\n// Push to dataLayer if needed\nif (data.sendDataLayer) {\n  settingsObject.event = \'gtm_consent_\' + data.command;\n  dataLayerPush(settingsObject);\n}\n\n// Call data.gtmOnSuccess when the tag is finished.\ndata.gtmOnSuccess();\n\n\n___WEB_PERMISSIONS___\n\n[\n  {\n    "instance": {\n      "key": {\n        "publicId": "logging",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "environments",\n          "value": {\n            "type": 1,\n            "string": "debug"\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "access_globals",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "keys",\n          "value": {\n            "type": 2,\n            "listItem": [\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "key"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  },\n                  {\n                    "type": 1,\n                    "string": "execute"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "dataLayer"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": false\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "key"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  },\n                  {\n                    "type": 1,\n                    "string": "execute"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "uetq"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": false\n                  }\n                ]\n              }\n            ]\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "access_consent",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "consentTypes",\n          "value": {\n            "type": 2,\n            "listItem": [\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "ad_storage"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "analytics_storage"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "personalization_storage"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "functionality_storage"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "security_storage"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "ad_user_data"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              },\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "consentType"\n                  },\n                  {\n                    "type": 1,\n                    "string": "read"\n                  },\n                  {\n                    "type": 1,\n                    "string": "write"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "ad_personalization"\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  },\n                  {\n                    "type": 8,\n                    "boolean": true\n                  }\n                ]\n              }\n            ]\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "write_data_layer",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "keyPatterns",\n          "value": {\n            "type": 2,\n            "listItem": [\n              {\n                "type": 1,\n                "string": "url_passthrough"\n              },\n              {\n                "type": 1,\n                "string": "ads_data_redaction"\n              }\n            ]\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  }\n]\n\n\n___TESTS___\n\nscenarios:\n- name: default settings sent\n  code: |-\n    // Call runCode to run the template\'s code.\n    runCode(mockData);\n\n    // Verify that the tag finished successfully.\n    assertApi(\'setDefaultConsentState\').wasCalledWith({\n      analytics_storage: \'denied\',\n      ad_user_data: \'granted\',\n      ad_personalization: \'denied\',\n      personalization_storage: \'denied\',\n      functionality_storage: \'denied\',\n      security_storage: \'denied\',\n      region: [\'US-CA\'],\n      wait_for_update: 500\n    });\n\n    assertApi(\'gtmOnSuccess\').wasCalled();\n- name: updated settings sent\n  code: |-\n    mockData.command = \'update\';\n\n    // Call runCode to run the template\'s code.\n    runCode(mockData);\n\n    // Verify that the tag finished successfully.\n    assertApi(\'updateConsentState\').wasCalledWith({\n      analytics_storage: \'denied\',\n      ad_user_data: \'granted\',\n      ad_personalization: \'denied\',\n      personalization_storage: \'denied\',\n      functionality_storage: \'denied\',\n      security_storage: \'denied\'\n    });\n    assertApi(\'gtmOnSuccess\').wasCalled();\n- name: extra settings sent\n  code: |-\n    mock(\'gtagSet\', (obj) => {\n      assertThat(obj.url_passthrough).isEqualTo(true);\n      assertThat(obj.ads_data_redaction).isEqualTo(true);\n    });\n    // Call runCode to run the template\'s code.\n    runCode(mockData);\n\n    // Verify that the tag finished successfully.\n    assertApi(\'gtmOnSuccess\').wasCalled();\n- name: dataLayer events generated\n  code: "mockData.sendDataLayer = true;\\n\\nlet dlCalled = false;\\n\\nmock(\'createQueue\',\\\n    \\ name => {\\n  return o => {\\n    if (o.event === \'gtm_consent_default\' && \\n\\\n    \\        o.analytics_storage === \'denied\' && \\n        o.ad_user_data === \'granted\'\\\n    \\ &&\\n        o.ad_personalization === \'denied\' &&\\n        o.personalization_storage\\\n    \\ === \'denied\' &&\\n        o.functionality_storage === \'denied\' &&\\n        o.security_storage\\\n    \\ === \'denied\' &&\\n        o.region[0] === \'US-CA\') dlCalled = true;\\n    \\n \\\n    \\ };\\n});\\n    \\n// Call runCode to run the template\'s code.\\nrunCode(mockData);\\n\\\n    \\n// Verify that the tag finished successfully.\\nassertApi(\'gtmOnSuccess\').wasCalled();\\n\\\n    assertThat(dlCalled, \'dataLayer not called with correct arguments\').isEqualTo(true);"\nsetup: |-\n  const mockData = {\n    platform_google: true,\n    platform_microsoft: true,\n    command: \'default\',\n    ad_storage: \'notset\',\n    analytics_storage: \'denied\',\n    ad_user_data: \'granted\',\n    ad_personalization: \'denied\',\n    personalization_storage: \'denied\',\n    functionality_storage: \'denied\',\n    security_storage: \'denied\',\n    wait_for_update: 500,\n    regions: \'US-CA\',\n    url_passthrough: true,\n    ads_data_redaction: true,\n    sendDataLayer: false,\n  };\n\n\n___NOTES___\n\nCreated on 13/08/2024, 15:40:09\n\n\n',
        galleryReference: {
          host: 'github.com',
          owner: 'gtm-templates-simo-ahava',
          repository: 'consent-mode',
          version: '3fcb1a6ee4649cc59e8e3084bdd20d3192c6e24b',
          signature:
            '6db03062ef91df7669025047e1dc4e7d55b47908f4e8e347816824225a9c3dd8'
        }
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        templateId: '226',
        name: 'Cookie creator for GA4 item list & Promotion attribution',
        fingerprint: '1710373714242',
        templateData:
          '___TERMS_OF_SERVICE___\n\nBy creating or modifying this file you agree to Google Tag Manager\'s Community\nTemplate Gallery Developer Terms of Service available at\nhttps://developers.google.com/tag-manager/gallery-tos (or such other URL as\nGoogle may provide), as modified from time to time.\n\n\n___INFO___\n\n{\n  "type": "TAG",\n  "id": "cvt_temp_public_id",\n  "version": 1,\n  "securityGroups": [],\n  "displayName": "Cookie creator for GA4 item list \\u0026 Promotion attribution",\n  "brand": {\n    "id": "brand_dummy",\n    "displayName": ""\n  },\n  "description": "",\n  "containerContexts": [\n    "WEB"\n  ]\n}\n\n\n___TEMPLATE_PARAMETERS___\n\n[\n  {\n    "type": "LABEL",\n    "name": "Info",\n    "displayName": "This tag is used to create/delete cookies that will help attribute ecommerce revenue in GA4 to appropriate List name or Promotion. \\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\nThe tag is doing following actions:\\u003c/br\\u003e\\n\\u003cli\\u003e When user interacts with product (below, you must specify what this action is), it creates cookies and stores List information inside the cookies. Name of the cookie will be \\"\\u003cb\\u003ega4_list_{{item ID}}\\u003c/b\\u003e\\". For each product user interacts, tag will create new cookie and store List information in it\\n\\u003cli\\u003e When user clicks on promotion, tag creates cookie called \\"\\u003cb\\u003ega4_promo\\u003c/b\\u003e\\" and stores promotion information inside the cookie. Only last clicked promotion information is stored in the cookie.\\n\\u003cli\\u003e When user makes a purchase, \\"\\u003cb\\u003ega4_promo\\u003c/b\\u003e\\" cookie will be deleted and any \\"\\u003cb\\u003ega4_list_{{item ID}}\\u003c/b\\u003e\\" cookies with purchased item ID will be deleted \\n\\u003c/br\\u003e\\n\\u003c/br\\u003e"\n  },\n  {\n    "type": "GROUP",\n    "name": "dlTypeSettings",\n    "displayName": "Data Layer Type",\n    "groupStyle": "NO_ZIPPY",\n    "subParams": [\n      {\n        "type": "SELECT",\n        "name": "dlType",\n        "displayName": "",\n        "macrosInSelect": false,\n        "selectItems": [\n          {\n            "value": "ga4",\n            "displayValue": "Google Analytics 4"\n          },\n          {\n            "value": "ua",\n            "displayValue": "Universal Analytics"\n          }\n        ],\n        "simpleValueType": true,\n        "alwaysInSummary": true,\n        "help": "",\n        "clearOnCopy": true\n      }\n    ],\n    "help": "What is the type of Data Layer that you use to push ecommerce information - GA4 or Universal Analytics?"\n  },\n  {\n    "type": "GROUP",\n    "name": "trackingGroup",\n    "displayName": "Which information you want to collect?",\n    "groupStyle": "NO_ZIPPY",\n    "subParams": [\n      {\n        "type": "CHECKBOX",\n        "name": "promoClickTracking",\n        "checkboxText": "Promotion Attribution",\n        "simpleValueType": true,\n        "help": "\\u003cb\\u003eIMPORTANT:\\u003c/b\\u003e Promotion information needs to be available on Promotion Click event! Otherwise, this solution won\\u0027t work.\\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\nIf you enable this option, cookie will collect any promo information which is available on \\u003cb\\u003ePromo Click\\u003c/b\\u003e event:\\n\\u003c/br\\u003e\\u003cli\\u003e\\u003cb\\u003epromotion_name\\u003c/b\\u003e (\\u003cb\\u003ename\\u003c/b\\u003e parameter in UA promo dataLayer), \\n\\u003c/br\\u003e\\u003cli\\u003e\\u003cb\\u003epromotion_id\\u003c/b\\u003e (\\u003cb\\u003eid\\u003c/b\\u003e parameter in UA promo dataLayer),\\n\\u003c/br\\u003e\\u003cli\\u003e\\u003cb\\u003ecreative_name\\u003c/b\\u003e (\\u003cb\\u003ecreative\\u003c/b\\u003e parameter in UA promo dataLayer) and\\n\\u003c/br\\u003e\\u003cli\\u003e\\u003cb\\u003ecreative_slot\\u003c/b\\u003e (\\u003cb\\u003eposition\\u003c/b\\u003e parameter in UA promo dataLayer)",\n        "alwaysInSummary": true\n      },\n      {\n        "type": "TEXT",\n        "name": "promoClickEvent",\n        "displayName": "Promotion Click event name in Data Layer",\n        "simpleValueType": true,\n        "alwaysInSummary": false,\n        "valueHint": "e.g. select_promotion",\n        "help": "Name of event which is used to push ecommerce \\u003cb\\u003ePromotion Click\\u003c/b\\u003e information into Data Layer (e.g. select_promotion or promotionClick)",\n        "enablingConditions": [\n          {\n            "paramName": "promoClickTracking",\n            "paramValue": true,\n            "type": "EQUALS"\n          }\n        ],\n        "valueValidators": [\n          {\n            "type": "NON_EMPTY"\n          }\n        ],\n        "clearOnCopy": true\n      },\n      {\n        "type": "CHECKBOX",\n        "name": "productClickTracking",\n        "checkboxText": "Product List Attribution",\n        "simpleValueType": true,\n        "valueValidators": [],\n        "help": "\\u003cb\\u003eIMPORTANT:\\u003c/b\\u003e List information needs to be available on Product List Click, Detail View or Add2Cart event! Otherwise, this solution won\\u0027t work.\\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\nIf you enable this option, tag will collect and store into the cookie following List information if it is available in Data Layer:\\n\\u003c/br\\u003e\\u003cli\\u003e \\u003cb\\u003eItem List Name\\u003c/b\\u003e (\\u003cb\\u003elist\\u003c/b\\u003e parameter in UA dataLayer),\\n\\u003c/br\\u003e\\u003cli\\u003e\\u003cb\\u003eItem List Position\\u003c/b\\u003e (\\u003cb\\u003eposition\\u003c/b\\u003e parameter in UA dataLayer)\\n\\u003c/br\\u003e\\u003cli\\u003eand \\u003cb\\u003eItem List ID\\u003c/b\\u003e (\\u003cb\\u003eitem_list_id\\u003c/b\\u003e parameter if you use GA4 dataLayer and if you have this information)",\n        "alwaysInSummary": true\n      },\n      {\n        "type": "GROUP",\n        "name": "eventNamewithListInfo",\n        "displayName": "",\n        "groupStyle": "NO_ZIPPY",\n        "subParams": [\n          {\n            "type": "LABEL",\n            "name": "infoLabel",\n            "displayName": "List information can be available on multiple ecommerce actions (e.g. Product List Click, Detail View or Add to Cart). \\u003c/br\\u003e\\nIf you have List information available on multiple ecommerce actions, provide name of event in corresponding field below.\\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\nIn case if you have List information available only on one ecommerce action (e.g. Product List Click), provide event name only in that field. Rest of the fields you can leave empty. \\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\n\\u003cb\\u003eIMPORTANT:\\u003c/b\\u003e In order for solution to work, you must specify at least one ecommerce event which contains list information in Data Layer."\n          },\n          {\n            "type": "TEXT",\n            "name": "listClickEvent",\n            "displayName": "Product List Click event name in Data Layer (leave empty if you don\\u0027t have List information available on Product List Click event)",\n            "simpleValueType": true,\n            "enablingConditions": [],\n            "valueHint": "e.g. select_item OR productClick",\n            "help": "Name of event which is used to push ecommerce Product List Click information into Data Layer (e.g. select_item or productClick) \\u003c/br\\u003e \\u003c/br\\u003e \\u003cb\\u003eIMPORTANT: \\n\\u003c/b\\u003e Provide event name only if you send List information with Product List Click ecommerce action!",\n            "alwaysInSummary": false,\n            "valueValidators": [],\n            "clearOnCopy": true\n          },\n          {\n            "type": "TEXT",\n            "name": "detailViewEvent",\n            "displayName": "Product Detail View event name in Data Layer (leave empty if you don\\u0027t have List information available on DetailView event)",\n            "simpleValueType": true,\n            "enablingConditions": [],\n            "valueHint": "e.g. view_item OR ProductDetailView",\n            "help": "Name of event which is used to push ecommerce List information into Data Layer (e.g. view_item or detailView) \\u003c/br\\u003e \\u003c/br\\u003e \\u003cb\\u003eIMPORTANT: \\u003c/b\\u003e Provide event name only if you send List information with Product Detail View ecommerce action!",\n            "alwaysInSummary": false,\n            "valueValidators": [],\n            "clearOnCopy": true\n          },\n          {\n            "type": "TEXT",\n            "name": "addToCartEvent",\n            "displayName": "Product Add to Cart event name in Data Layer (leave empty if you don\\u0027t have List information available on AddToCart event)",\n            "simpleValueType": true,\n            "enablingConditions": [],\n            "valueHint": "e.g. add_to_cart OR addToCart",\n            "help": "Name of event which is used to push ecommerce List information into Data Layer (e.g. add_to_cart OR addToCart) \\u003c/br\\u003e \\u003c/br\\u003e \\u003cb\\u003eIMPORTANT: \\u003c/b\\u003e Provide event name only if you send List information with Product Add to Cart ecommerce action!",\n            "alwaysInSummary": false,\n            "valueValidators": [],\n            "clearOnCopy": true\n          }\n        ],\n        "enablingConditions": [\n          {\n            "paramName": "productClickTracking",\n            "paramValue": true,\n            "type": "EQUALS"\n          }\n        ]\n      }\n    ]\n  },\n  {\n    "type": "GROUP",\n    "name": "purchaseEventSection",\n    "displayName": "Purchase event",\n    "groupStyle": "NO_ZIPPY",\n    "subParams": [\n      {\n        "type": "TEXT",\n        "name": "purchaseEvent",\n        "displayName": "Purchase event name in Data Layer",\n        "simpleValueType": true,\n        "valueHint": "e.g. purchase",\n        "help": "Name of event which is used to push ecommerce \\u003cb\\u003ePurchase\\u003c/b\\u003e information into Data Layer (e.g. purchase)",\n        "alwaysInSummary": false,\n        "valueValidators": [\n          {\n            "type": "NON_EMPTY"\n          }\n        ],\n        "clearOnCopy": true\n      }\n    ],\n    "help": "On Purchase event, cookies will be deleted.\\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\nBehavior:\\n\\u003c/br\\u003e\\n\\u003cli\\u003eIf user purchased product that has List information stored in \\"ga4_list_{{item ID}}\\" cookie, cookie will be deleted after purchase\\n\\u003cli\\u003eIf user had any Promo information stored in the cookie \\"ga4_promo\\", cookie will be deleted after purchase"\n  },\n  {\n    "type": "GROUP",\n    "name": "cookieSettings",\n    "displayName": "By default, cookies are session based, which means cookies will be erased when browser session ends.",\n    "groupStyle": "NO_ZIPPY",\n    "subParams": [\n      {\n        "type": "CHECKBOX",\n        "name": "cookieExpirationCheckbox",\n        "checkboxText": "Modify cookie expiration setting?",\n        "simpleValueType": true,\n        "clearOnCopy": true\n      }\n    ]\n  },\n  {\n    "type": "TEXT",\n    "name": "cookieLength",\n    "displayName": "Cookie expiration",\n    "simpleValueType": true,\n    "defaultValue": 0,\n    "help": "By default, value is 0. This means the cookie will be session-based - when browser session ends, cookie will be deleted. \\nFor example, if you want to keep List information for 24 hours, put value 86400 ( 24 * 60 * 60).\\n\\u003c/br\\u003e\\n\\u003c/br\\u003e\\n\\u003cb\\u003eRECOMMENDED:\\u003c/b\\u003e use default value (0), so cookies are deleted after every browser session",\n    "valueUnit": "seconds",\n    "alwaysInSummary": false,\n    "valueValidators": [\n      {\n        "type": "NON_EMPTY"\n      }\n    ],\n    "enablingConditions": [\n      {\n        "paramName": "cookieExpirationCheckbox",\n        "paramValue": true,\n        "type": "EQUALS"\n      }\n    ],\n    "clearOnCopy": true\n  }\n]\n\n\n___SANDBOXED_JS_FOR_WEB_TEMPLATE___\n\n/**\n * @license\n * Copyright 2023 Google LLC\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n *      http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n\n\n// Get APIs\nconst dataLayer = require(\'copyFromDataLayer\');\nconst getCookieValues = require(\'getCookieValues\');\nconst setCookie = require(\'setCookie\');\nconst log = require(\'logToConsole\');\nconst makeNumber = require(\'makeNumber\');\nconst getUrl = require(\'getUrl\');\n\n// Get values from defined fields in the Tag\nconst dlType = data.dlType;\nconst cookieLength = data.cookieLength;\nconst listClickEvent = data.listClickEvent;\nconst detailViewEvent = data.detailViewEvent;\nconst addToCartEvent = data.addToCartEvent;\nconst promoClickEvent = data.promoClickEvent;\nconst purchaseEvent = data.purchaseEvent;\n\n// Set necessary information for creating/removing cookie\nconst dlEvent = dataLayer(\'event\');\nconst ecommerce = dataLayer(\'ecommerce\', 2);\nconst maxAge = makeNumber(cookieLength) > 1 ? makeNumber(cookieLength) : undefined;\nconst hostname = getUrl(\'host\').indexOf(\'www.\') > -1 ? getUrl(\'host\').replace(\'www.\', \'\') : getUrl(\'host\');\nconst optionsAddCookie = {\n    domain: hostname,\n    path: \'/\',\n   \'max-age\': maxAge,\n};\nconst optionsRemoveCookie = {\n    domain: hostname,\n    path: \'/\',\n    expires: \'Thu, 01 Jan 1970 00:00:01 GMT\',\n};\n\n\n// Create/delete cookies if it is GA4 dataLayer\nif (dlType === \'ga4\') {\n    switch (dlEvent) {\n       \n        case listClickEvent:\n        case detailViewEvent:\n        case addToCartEvent:\n            for (const item of ecommerce.items) {\n                const productID = item.hasOwnProperty(\'item_id\') ? item.item_id : undefined;\n                const listPosition = item.hasOwnProperty(\'index\') ? item.index : undefined;\n                const listName = \n                    (item.hasOwnProperty(\'item_list_name\')) ? (item.item_list_name)\n                      : ((ecommerce.hasOwnProperty(\'item_list_name\')) ? (ecommerce.item_list_name)\n                        : undefined);\n                const listId =\n                    (item.hasOwnProperty(\'item_list_id\')) ? (item.item_list_id)\n                      : ((ecommerce.hasOwnProperty(\'item_list_id\')) ? (ecommerce.item_list_id)\n                      : undefined);\n              \n                if (item.hasOwnProperty(\'item_list_name\') || ecommerce.hasOwnProperty(\'item_list_name\')) {\n                      // If there is item_list_name parameter inside Items array, create "ga4_list_{{Product ID}}" cookie with List information and store information\n                      setCookie(\'ga4_list_\' + productID, listPosition + \'//\' + listName + \'//\' + listId, optionsAddCookie);\n                }\n            }\n            break;\n  \n      case promoClickEvent:\n          const promotionID = \n              (ecommerce.hasOwnProperty(\'promotion_id\')) ? (ecommerce.promotion_id)\n                  : ((ecommerce.items[0].hasOwnProperty(\'promotion_id\')) ? (ecommerce.items[0].promotion_id)\n                      : undefined);\n          const promotionName = \n              (ecommerce.hasOwnProperty(\'promotion_name\')) ? (ecommerce.promotion_name)\n                  : ((ecommerce.items[0].hasOwnProperty(\'promotion_name\')) ? (ecommerce.items[0].promotion_name)\n                      : undefined);\n          const creativeName = \n              (ecommerce.hasOwnProperty(\'creative_name\')) ? (ecommerce.creative_name)\n                  : ((ecommerce.items[0].hasOwnProperty(\'creative_name\')) ? (ecommerce.items[0].creative_name)\n                      : undefined);\n          const creativeSlot = \n              (ecommerce.hasOwnProperty(\'creative_slot\')) ? (ecommerce.creative_slot)\n                  : ((ecommerce.items[0].hasOwnProperty(\'creative_slot\')) ? (ecommerce.items[0].creative_slot)\n                      : undefined);\n          // create "ga4_promo" cookie with Promo information\n          setCookie(\'ga4_promo\', promotionID + \'//\' + promotionName + \'//\' + creativeName + \'//\' + creativeSlot, optionsAddCookie);\n          break;\n\n      case purchaseEvent:\n          for (const item of ecommerce.items) {\n              const productID = item.hasOwnProperty(\'item_id\') ? item.item_id : undefined;\n              if (getCookieValues(\'ga4_list_\' + productID).length > 0) {\n                  // remove "ga4_list_{{Product ID}}" cookie if it exists for purchased products\n                  setCookie(\'ga4_list_\' + productID, \'remove\', optionsRemoveCookie);\n              }\n          }\n          if (getCookieValues(\'ga4_promo\').length > 0) {\n              // remove "ga4_promo" cookie if it exists\n              setCookie(\'ga4_promo\', \'remove\', optionsRemoveCookie);\n          }\n          break;\n    \n      default:\n          break;\n    }\n}\n\n\nfunction setGA4ListCookie(ecommerce, property) {\n    for (const product of ecommerce[property].products) {\n        const productID = product.hasOwnProperty(\'id\') ? product.id : undefined;\n        const listPosition = product.hasOwnProperty(\'position\') ? product.position : undefined;\n        const listName = \n            (product.hasOwnProperty(\'list\')) ? (product.list)\n                : ((ecommerce[property].hasOwnProperty(\'actionField\') && ecommerce[property].actionField.hasOwnProperty(\'list\')) ? (ecommerce[property].actionField.list)\n                  : undefined);\n      \n        if (product.hasOwnProperty(\'list\') || (ecommerce[property].hasOwnProperty(\'actionField\') && ecommerce[property].actionField.hasOwnProperty(\'list\'))) {\n            // If there is list parameter inside Products array, create "ga4_list_{{Product ID}}" cookie with List information and store information\n            setCookie(\'ga4_list_\' + productID, listPosition + \'//\' + listName + \'//\', optionsAddCookie);\n        }\n    }\n}\n\n// Create/delete cookie if it is UA dataLayer\nif (dlType === \'ua\') {\n    switch (dlEvent) {\n      \n        case listClickEvent:\n        case detailViewEvent:\n        case addToCartEvent:\n        \n            if (dlEvent === listClickEvent) {\n                setGA4ListCookie(ecommerce, \'click\');\n            } \n            else if (dlEvent === detailViewEvent) {\n                setGA4ListCookie(ecommerce, \'detail\');\n            } \n            else if (dlEvent === addToCartEvent){\n                setGA4ListCookie(ecommerce, \'add\');\n            }\n            break;\n\n        case promoClickEvent:\n            const promo = ecommerce.promoClick.promotions[0];\n            const promotionID = promo.hasOwnProperty(\'id\') ? promo.id : undefined;\n            const promotionName = promo.hasOwnProperty(\'name\') ? promo.name : undefined;\n            const creativeName = promo.hasOwnProperty(\'creative\') ? promo.creative : undefined;\n            const creativeSlot = promo.hasOwnProperty(\'position\') ? promo.position : undefined;\n            // create "ga4_promo" cookie with Promo information\n            setCookie(\'ga4_promo\', promotionID + \'//\' + promotionName + \'//\' + creativeName + \'//\' + creativeSlot, optionsAddCookie);\n            break;\n\n        case purchaseEvent:\n            for (const product of ecommerce.purchase.products) {\n                if (getCookieValues(\'ga4_list_\' + product.id).length > 0) {\n                    // remove "ga4_list_{{Product ID}}" cookie if it exists for purchased products\n                    setCookie(\'ga4_list_\' + product.id, \'remove\', optionsRemoveCookie);\n                }\n            }\n            if (getCookieValues(\'ga4_promo\').length > 0) {\n                // remove "ga4_promo" cookie if it exists\n                setCookie(\'ga4_promo\', \'remove\', optionsRemoveCookie);\n            }\n            break;\n\n        default:\n            log(\'GTM Cookie Creator tag - Tag fired on other event which is not specified in the Tag configuration. Please check Cookie Creator tag configuration again and make sure tag only fires on events which contain List and/or Promotion information.\');\n            break;\n    }\n}\n\ndata.gtmOnSuccess();\n\n\n___WEB_PERMISSIONS___\n\n[\n  {\n    "instance": {\n      "key": {\n        "publicId": "logging",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "environments",\n          "value": {\n            "type": 1,\n            "string": "debug"\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "get_cookies",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "cookieAccess",\n          "value": {\n            "type": 1,\n            "string": "any"\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "read_data_layer",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "keyPatterns",\n          "value": {\n            "type": 2,\n            "listItem": [\n              {\n                "type": 1,\n                "string": "ecommerce.*"\n              },\n              {\n                "type": 1,\n                "string": "event"\n              }\n            ]\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "set_cookies",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "allowedCookies",\n          "value": {\n            "type": 2,\n            "listItem": [\n              {\n                "type": 3,\n                "mapKey": [\n                  {\n                    "type": 1,\n                    "string": "name"\n                  },\n                  {\n                    "type": 1,\n                    "string": "domain"\n                  },\n                  {\n                    "type": 1,\n                    "string": "path"\n                  },\n                  {\n                    "type": 1,\n                    "string": "secure"\n                  },\n                  {\n                    "type": 1,\n                    "string": "session"\n                  }\n                ],\n                "mapValue": [\n                  {\n                    "type": 1,\n                    "string": "*"\n                  },\n                  {\n                    "type": 1,\n                    "string": "*"\n                  },\n                  {\n                    "type": 1,\n                    "string": "*"\n                  },\n                  {\n                    "type": 1,\n                    "string": "any"\n                  },\n                  {\n                    "type": 1,\n                    "string": "any"\n                  }\n                ]\n              }\n            ]\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  },\n  {\n    "instance": {\n      "key": {\n        "publicId": "get_url",\n        "versionId": "1"\n      },\n      "param": [\n        {\n          "key": "urlParts",\n          "value": {\n            "type": 1,\n            "string": "any"\n          }\n        },\n        {\n          "key": "queriesAllowed",\n          "value": {\n            "type": 1,\n            "string": "any"\n          }\n        }\n      ]\n    },\n    "clientAnnotations": {\n      "isEditedByUser": true\n    },\n    "isRequired": true\n  }\n]\n\n\n___TESTS___\n\nscenarios: []\nsetup: \'\'\n\n\n___NOTES___\n\n\n\n\n'
      },
      {
        accountId: '6140708819',
        containerId: '168785492',
        templateId: '228',
        name: 'GA4 Items array',
        fingerprint: '1710373714244',
        templateData:
          "___TERMS_OF_SERVICE___\n\nBy creating or modifying this file you agree to Google Tag Manager's Community\nTemplate Gallery Developer Terms of Service available at\nhttps://developers.google.com/tag-manager/gallery-tos (or such other URL as\nGoogle may provide), as modified from time to time.\n\n\n___INFO___\n\n{\n  \"type\": \"MACRO\",\n  \"id\": \"cvt_temp_public_id\",\n  \"version\": 1,\n  \"securityGroups\": [],\n  \"displayName\": \"GA4 Items array\",\n  \"description\": \"\",\n  \"containerContexts\": [\n    \"WEB\"\n  ]\n}\n\n\n___TEMPLATE_PARAMETERS___\n\n[]\n\n\n___SANDBOXED_JS_FOR_WEB_TEMPLATE___\n\n/**\n * @license\n * Copyright 2023 Google LLC\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n *      http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n\n// Define required APIs and variables\nconst log = require('logToConsole');\nconst dataLayer = require('copyFromDataLayer');\nconst ecommerce = dataLayer('ecommerce', 1);\nconst getCookieValues = require('getCookieValues');\nconst dlEvent = dataLayer('event');\n\nlet items = [];\n\n// function for grabbing Item list name and returning the value (UA)\nfunction listNameUa(ecomObj, prod) {\n    if (prod.hasOwnProperty('list') && prod.list) {\n        return prod.list;\n    } \n    else if (ecomObj.hasOwnProperty('actionField') && ecomObj.actionField.hasOwnProperty('list') && ecomObj.actionField.list) {\n        return ecomObj.actionField.list;\n    } \n    else if (getCookieValues('ga4_list_' + prod.id).length > 0 && getCookieValues('ga4_list_' + prod.id)[0].split('//')[1] !== 'undefined' && getCookieValues('ga4_list_' + prod.id)[0].split('//')[1] !== '') {\n        return getCookieValues('ga4_list_' + prod.id)[0].split('//')[1];\n    } else {\n        return undefined;\n    }\n}\n\n// function for grabbing Item list name and returning the value (GA4)\nfunction listNameGa4(ecomObj, prod) {\n    if (prod.hasOwnProperty('item_list_name') && prod.item_list_name) {\n        return prod.item_list_name;\n    }\n    else if (ecomObj.hasOwnProperty('item_list_name') && ecomObj.item_list_name) {\n        return ecomObj.item_list_name;\n    } \n    else if (getCookieValues('ga4_list_' + prod.item_id).length > 0 && getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[1] !== 'undefined' && getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[1] !== '') {\n        return getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[1];\n    }\n    else {\n        return undefined;\n    }\n}\n\n// function for grabbing Item list position and returning the value (UA)\nfunction listPositionUa(prod) {\n    if (prod.hasOwnProperty('position') && prod.position) {\n        return prod.position;\n    }\n    else if (getCookieValues('ga4_list_' + prod.id).length > 0 && getCookieValues('ga4_list_' + prod.id)[0].split('//')[0] !== 'undefined' && getCookieValues('ga4_list_' + prod.id)[0].split('//')[0] !== '') {\n        return getCookieValues('ga4_list_' + prod.id)[0].split('//')[0];\n    }\n    else {\n        return undefined;\n    }\n}\n\n// function for grabbing Item list position and returning the value (GA4)\nfunction listPositionGa4(prod) {\n    if (prod.hasOwnProperty('index') && prod.index) {\n        return prod.index;\n    }\n    else if (getCookieValues('ga4_list_' + prod.item_id).length > 0 && getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[0] !== 'undefined' && getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[0] !== '') {\n        return getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[0];\n    }\n    else {\n        return undefined;\n    }\n}\n\n// function for grabbing Item list ID and returning the value (only for GA4)\nfunction listIdGa4(ecomObj, prod) {\n    if (prod.hasOwnProperty('item_list_id') && prod.item_list_id) {\n        return prod.item_list_id;\n    }\n    else if (ecomObj.hasOwnProperty('item_list_id') && ecomObj.item_list_id) {\n        return ecomObj.item_list_id;\n    }\n    else if (getCookieValues('ga4_list_' + prod.item_id).length > 0 && getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[2] !== 'undefined' && getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[2] !== '') {\n        return getCookieValues('ga4_list_' + prod.item_id)[0].split('//')[2];\n    }\n    else {\n        return undefined;\n    }\n}\n\n// grabbing UA custom dimensions and metrics\nfunction parseDimensionsMetrics(obj, item) {\n  for (var cd in obj) {\n      if (obj.hasOwnProperty(cd)) {\n          if (cd.match('^dimension[0-9]+')) {\n              item[cd] = obj[cd];\n          }\n      }\n  }\n  for (var cm in obj) {\n      if (obj.hasOwnProperty(cm)) {\n          if (cm.match('^metric[0-9]+')) {\n              item[cm] = obj[cm];\n          }\n      }\n  }\n  return item;\n}\n\n\nfunction buildItem(product, itemListName) {\n  return {\n    item_name: product.hasOwnProperty('name') ? product.name : undefined,\n    item_id: product.hasOwnProperty('id') ? product.id : undefined,\n    price: product.hasOwnProperty('price') ? product.price : 0,\n    item_brand: product.hasOwnProperty('brand') ? product.brand : undefined,\n    item_category: product.hasOwnProperty('category') ? product.category.split('/')[0] : undefined,\n    item_category2: product.hasOwnProperty('category') ? product.category.split('/')[1] : undefined,\n    item_category3: product.hasOwnProperty('category') ? product.category.split('/')[2] : undefined,\n    item_category4: product.hasOwnProperty('category') ? product.category.split('/')[3] : undefined,\n    item_variant: product.hasOwnProperty('variant') ? product.variant : undefined,\n    quantity: product.hasOwnProperty('quantity') ? product.quantity : '1',\n    item_list_name: itemListName,\n    index: listPositionUa(product),\n  };\n}\n\nfunction getItemsFromUAEvent(products, key) {\n    const items = [];\n    for (const product of products) {\n        const itemListName = listNameUa(ecommerce[key], product);\n        let item = buildItem(product, itemListName);\n        item = parseDimensionsMetrics(product, item);\n        items.push(item);\n    }\n    return items;\n}\n\n\n// Check the type of Data Layer and create Items array\nif (ecommerce.hasOwnProperty('items')) {\n    // For all GA4 Data Layer events\n    for (const item of ecommerce.items) {\n        item.item_list_name = listNameGa4(ecommerce, item);\n        item.item_list_id = listIdGa4(ecommerce, item);\n        item.index = listPositionGa4(item);\n        items.push(item);\n    }\n    return items;\n}\nelse if (ecommerce.hasOwnProperty('impressions')) {\n    // UA product list impression event\n    return getItemsFromUAEvent(ecommerce.impressions, 'impressions');\n}\nelse if (ecommerce.hasOwnProperty('click')) {\n    // UA product list click event\n    return getItemsFromUAEvent(ecommerce.click.products, 'click');\n}\nelse if (ecommerce.hasOwnProperty('detail')) {\n    // UA product detail view event\n    return getItemsFromUAEvent(ecommerce.detail.products, 'detail');\n}\nelse if (ecommerce.hasOwnProperty('add')) {\n    // UA product add2cart event\n    return getItemsFromUAEvent(ecommerce.add.products, 'add');\n}\nelse if (ecommerce.hasOwnProperty('remove')) {\n    // UA product remove from cart event\n    return getItemsFromUAEvent(ecommerce.remove.products, 'remove');\n}\nelse if (ecommerce.hasOwnProperty('checkout')) {\n    // UA product checkout event\n    return getItemsFromUAEvent(ecommerce.checkout.products, 'checkout');\n}\nelse if (ecommerce.hasOwnProperty('purchase')) {\n    // UA product purchase event\n    return getItemsFromUAEvent(ecommerce.purchase.products, 'purchase');\n}\nelse {\n    // If it doesn't match anything, return undefined value\n    return undefined;\n}\n\n\n___WEB_PERMISSIONS___\n\n[\n  {\n    \"instance\": {\n      \"key\": {\n        \"publicId\": \"logging\",\n        \"versionId\": \"1\"\n      },\n      \"param\": [\n        {\n          \"key\": \"environments\",\n          \"value\": {\n            \"type\": 1,\n            \"string\": \"debug\"\n          }\n        }\n      ]\n    },\n    \"clientAnnotations\": {\n      \"isEditedByUser\": true\n    },\n    \"isRequired\": true\n  },\n  {\n    \"instance\": {\n      \"key\": {\n        \"publicId\": \"get_cookies\",\n        \"versionId\": \"1\"\n      },\n      \"param\": [\n        {\n          \"key\": \"cookieAccess\",\n          \"value\": {\n            \"type\": 1,\n            \"string\": \"any\"\n          }\n        }\n      ]\n    },\n    \"clientAnnotations\": {\n      \"isEditedByUser\": true\n    },\n    \"isRequired\": true\n  },\n  {\n    \"instance\": {\n      \"key\": {\n        \"publicId\": \"read_data_layer\",\n        \"versionId\": \"1\"\n      },\n      \"param\": [\n        {\n          \"key\": \"keyPatterns\",\n          \"value\": {\n            \"type\": 2,\n            \"listItem\": [\n              {\n                \"type\": 1,\n                \"string\": \"ecommerce\"\n              },\n              {\n                \"type\": 1,\n                \"string\": \"ecommerce.*\"\n              },\n              {\n                \"type\": 1,\n                \"string\": \"event\"\n              }\n            ]\n          }\n        }\n      ]\n    },\n    \"clientAnnotations\": {\n      \"isEditedByUser\": true\n    },\n    \"isRequired\": true\n  }\n]\n\n\n___TESTS___\n\nscenarios: []\n\n\n___NOTES___\n\n\n\n\n"
      }
    ]
  }
};
