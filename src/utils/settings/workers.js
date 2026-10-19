// 还原自打包产物 — 原始模块: utils/settings/workers.js
var __defProp, __esm, __export, __getOwnPropNames, editwk, json, json2, json3, jsonvae, jsonweilinvae, jsonweldf, runninghubDefaultJson;

json = `{
    "2": {
      "inputs": {
        "stop_at_clip_layer": -2,
        "clip": [
          "20",
          1
        ]
      },
      "class_type": "CLIPSetLastLayer",
      "_meta": {
        "title": "CLIP\u8BBE\u7F6E\u505C\u6B62\u5C42"
      }
    },
    "5": {
      "inputs": {
        "seed": "%seed%",
        "steps": "%steps%",
        "cfg": "%cfg_scale%",
        "sampler_name": "%sampler_name%",
        "scheduler": "%scheduler%",
        "denoise": 1,
        "model": [
          "158",
          0
        ],
        "positive": [
          "158",
          1
        ],
        "negative": [
          "59",
          0
        ],
        "latent_image": [
          "6",
          0
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "K\u91C7\u6837\u5668"
      }
    },
    "6": {
      "inputs": {
        "width": "%width%",
        "height": "%height%",
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "\u7A7ALatent"
      }
    },
    "20": {
      "inputs": {
        "ckpt_name": "%MODEL_NAME%"
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Checkpoint\u52A0\u8F7D\u5668(\u7B80\u6613)"
      }
    },
    "31": {
      "inputs": {
        "samples": [
          "5",
          0
        ],
        "vae": [
          "20",
          2
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE\u89E3\u7801"
      }
    },
    "59": {
      "inputs": {
        "text": "%negative_prompt%",
        "speak_and_recognation": true,
        "clip": [
          "2",
          0
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP\u6587\u672C\u7F16\u7801\u5668"
      }
    },
    "122": {
      "inputs": {
        "filename_prefix": "lowres_MANGURI",
        "images": [
          "31",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "\u4FDD\u5B58\u56FE\u50CF"
      }
    },
    "158": {
      "inputs": {
        "positive": "%prompt%",
        "\u6253\u5F00\u53EF\u89C6\u5316PromptUI": "",
        "speak_and_recognation": true,
        "model": [
          "20",
          0
        ],
        "clip": [
          "2",
          0
        ]
      },
      "class_type": "WeiLinComfyUIPromptToLorasOnly",
      "_meta": {
        "title": "WeiLin \u6B63\u5411\u63D0\u793A\u8BCDLora\u81EA\u52A8\u52A0\u8F7D"
      }
    }
  }`;

json2 = `{
    "3": {
      "inputs": {
        "seed": "%seed%",
        "steps": "%steps%",
        "cfg": "%cfg_scale%",
        "sampler_name": "%sampler_name%",
        "scheduler": "%scheduler%",
        "denoise": 1,
        "model": [
          "15",
          0
        ],
        "positive": [
          "20",
          1
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "19",
          0
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "K\u91C7\u6837\u5668"
      }
    },
    "4": {
      "inputs": {
        "ckpt_name": "%MODEL_NAME%"
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Checkpoint\u52A0\u8F7D\u5668(\u7B80\u6613)"
      }
    },
    "7": {
      "inputs": {
        "text": "%negative_prompt%",
        "speak_and_recognation": true,
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP\u6587\u672C\u7F16\u7801\u5668"
      }
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE\u89E3\u7801"
      }
    },
    "23": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "\u4FDD\u5B58\u56FE\u50CF"
      }
    },
    "13": {
      "inputs": {
        "preset": "%ipa%",
        "model": [
          "20",
          0
        ]
      },
      "class_type": "IPAdapterUnifiedLoader",
      "_meta": {
        "title": "IPAdapter\u52A0\u8F7D\u5668"
      }
    },
    "14": {
      "inputs": {
        "image": "%comfyuicankaotupian%",
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": {
        "title": "\u52A0\u8F7D\u56FE\u50CF"
      }
    },
    "15": {
      "inputs": {
        "weight": "%c_quanzhong%",
        "weight_faceidv2": "%c_idquanzhong%",
        "weight_type": "style and composition",
        "combine_embeds": "concat",
        "start_at": 0,
        "end_at": 1,
        "embeds_scaling": "K+mean(V) w/ C penalty",
        "layer_weights": "0:0, 1:0, 2:0, 3:"%c_xijie%", 4:0, 5:0, 6:"%c_fenwei%", 7:0, 8:0, 9:0, 10:0",
        "speak_and_recognation": true,
        "model": [
          "13",
          0
        ],
        "ipadapter": [
          "13",
          1
        ],
        "image": [
          "14",
          0
        ]
      },
      "class_type": "IPAdapterMS",
      "_meta": {
        "title": "\u5E94\u7528IPAdapter Mad Scientist"
      }
    },
    "19": {
      "inputs": {
        "width": "%width%",
        "height": "%height%",
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "\u7A7ALatent"
      }
    },
    "20": {
      "inputs": {
        "positive": "%prompt%",
        "\u6253\u5F00\u53EF\u89C6\u5316PromptUI": "",
        "speak_and_recognation": true,
        "model": [
          "4",
          0
        ],
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "WeiLinComfyUIPromptToLorasOnly",
      "_meta": {
        "title": "WeiLin \u6B63\u5411\u63D0\u793A\u8BCDLora\u81EA\u52A8\u52A0\u8F7D"
      }
    }
  }`;

json3 = `{
      "3": {
      "inputs": {
        "seed": "%seed%",
        "steps": "%steps%",
        "cfg": "%cfg_scale%",
        "sampler_name": "%sampler_name%",
        "scheduler": "%scheduler%",
        "denoise": 1,
        "model": [
          "39",
            0
          ],
          "positive": [
            "39",
            1
          ],
          "negative": [
            "7",
            0
          ],
          "latent_image": [
            "5",
            0
          ]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "K\u91C7\u6837\u5668"
        }
      },
      "5": {
        "inputs": {
          "width": "%width%",
          "height": "%height%",
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage",
        "_meta": {
          "title": "\u7A7ALatent"
        }
      },
      "7": {
        "inputs": {
          "text": "%negative_prompt%",
          "speak_and_recognation": true,
          "clip": [
            "14",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP\u6587\u672C\u7F16\u7801\u5668"
        }
      },
      "8": {
        "inputs": {
          "samples": [
            "3",
            0
          ],
          "vae": [
            "14",
            2
          ]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE\u89E3\u7801"
        }
      },
      "14": {
        "inputs": {
          "ckpt_name": "%MODEL_NAME%"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Checkpoint\u52A0\u8F7D\u5668(\u7B80\u6613)"
        }
      },
      "23": {
        "inputs": {
          "model_name": "bbox/face_yolov8m.pt"
        },
        "class_type": "UltralyticsDetectorProvider",
        "_meta": {
          "title": "\u68C0\u6D4B\u52A0\u8F7D\u5668"
        }
      },
      "25": {
        "inputs": {
          "model_name": "sam_vit_b_01ec64.pth",
          "device_mode": "AUTO"
        },
        "class_type": "SAMLoader",
        "_meta": {
          "title": "SAM\u52A0\u8F7D\u5668"
        }
      },
      "26": {
        "inputs": {
          "model_name": "segm/person_yolov8m-seg.pt"
        },
        "class_type": "UltralyticsDetectorProvider",
        "_meta": {
          "title": "\u68C0\u6D4B\u52A0\u8F7D\u5668"
        }
      },
      "30": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": [
            "35",
            0
          ]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "\u4FDD\u5B58\u56FE\u50CF"
        }
      },
      "35": {
        "inputs": {
          "guide_size": 512,
          "guide_size_for": true,
          "max_size": 1024,
          "seed": "%seed%",
          "steps": "%steps%",
          "cfg": "%cfg_scale%",
          "sampler_name": "%sampler_name%",
          "scheduler": "%scheduler%",
          "denoise": 0.5,
          "feather": 5,
          "noise_mask": true,
          "force_inpaint": true,
          "bbox_threshold": 0.5,
          "bbox_dilation": 10,
          "bbox_crop_factor": 3,
          "sam_detection_hint": "center-1",
          "sam_dilation": 0,
          "sam_threshold": 0.93,
          "sam_bbox_expansion": 0,
          "sam_mask_hint_threshold": 0.7000000000000001,
          "sam_mask_hint_use_negative": "False",
          "drop_size": 10,
          "wildcard": "",
          "cycle": 1,
          "inpaint_model": false,
          "noise_mask_feather": 20,
          "speak_and_recognation": true,
          "image": [
            "8",
            0
          ],
          "model": [
            "39",
            0
          ],
          "clip": [
            "14",
            1
          ],
          "vae": [
            "14",
            2
          ],
          "positive": [
            "39",
            1
          ],
          "negative": [
            "7",
            0
          ],
          "bbox_detector": [
            "23",
            0
          ],
          "sam_model_opt": [
            "25",
            0
          ],
          "segm_detector_opt": [
            "26",
            1
          ]
        },
        "class_type": "FaceDetailer",
        "_meta": {
          "title": "\u9762\u90E8\u7EC6\u5316"
        }
      },
      "39": {
        "inputs": {
          "positive": "%prompt%",
          "\u6253\u5F00\u53EF\u89C6\u5316PromptUI": "",
          "speak_and_recognation": true,
          "model": [
            "14",
            0
          ],
          "clip": [
            "14",
            1
          ]
        },
        "class_type": "WeiLinComfyUIPromptToLorasOnly",
        "_meta": {
          "title": "WeiLin \u6B63\u5411\u63D0\u793A\u8BCDLora\u81EA\u52A8\u52A0\u8F7D"
        }
    }
  }`;

editwk = `{
  "1": {
    "inputs": {
      "ckpt_name": "%MODEL_NAME%"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Checkpoint\u52A0\u8F7D\u5668\uFF08\u7B80\u6613\uFF09"
    }
  },
  "2": {
    "inputs": {
      "text": "%inpaint_positive%",
      "speak_and_recognation": {
        "__value__": [
          false,
          true
        ]
      },
      "clip": [
        "1",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP\u6587\u672C\u7F16\u7801"
    }
  },
  "3": {
    "inputs": {
      "text": "%inpaint_negative%",
      "speak_and_recognation": {
        "__value__": [
          false,
          true
        ]
      },
      "clip": [
        "1",
        1
      ]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP\u6587\u672C\u7F16\u7801"
    }
  },
  "4": {
    "inputs": {
      "image": "%inpaint_image%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u50CF"
    }
  },
  "5": {
    "inputs": {
      "pixels": [
        "4",
        0
      ],
      "vae": [
        "1",
        2
      ]
    },
    "class_type": "VAEEncode",
    "_meta": {
      "title": "VAE\u7F16\u7801"
    }
  },
  "6": {
    "inputs": {
      "samples": [
        "5",
        0
      ],
      "mask": [
        "14",
        0
      ]
    },
    "class_type": "SetLatentNoiseMask",
    "_meta": {
      "title": "\u8BBE\u7F6ELatent\u566A\u6CE2\u906E\u7F69"
    }
  },
  "7": {
    "inputs": {
      "seed": 680566878009757,
      "steps": 28,
      "cfg": 8,
      "sampler_name": "dpmpp_2m",
      "scheduler": "normal",
      "denoise": "%inpaint_denoise%",
      "model": [
        "1",
        0
      ],
      "positive": [
        "2",
        0
      ],
      "negative": [
        "3",
        0
      ],
      "latent_image": [
        "6",
        0
      ]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "K\u91C7\u6837\u5668"
    }
  },
  "8": {
    "inputs": {
      "samples": [
        "7",
        0
      ],
      "vae": [
        "1",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE\u89E3\u7801"
    }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI_Inpaint",
      "images": [
        "8",
        0
      ]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "\u4FDD\u5B58\u56FE\u50CF"
    }
  },
  "11": {
    "inputs": {
      "samples": [
        "6",
        0
      ],
      "vae": [
        "1",
        2
      ]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE\u89E3\u7801"
    }
  },
  "12": {
    "inputs": {
      "images": [
        "11",
        0
      ]
    },
    "class_type": "PreviewImage",
    "_meta": {
      "title": "\u9884\u89C8\u56FE\u50CF"
    }
  },
  "14": {
    "inputs": {
      "image": "%inpaint_mask%",
      "channel": "red"
    },
    "class_type": "LoadImageMask",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u50CF\uFF08\u4F5C\u4E3A\u906E\u7F69\uFF09"
    }
  }
}`;

jsonweldf = `{
    "3": {
      "inputs": {
        "seed": "%seed%",
        "steps": "%steps%",
        "cfg": "%cfg_scale%",
        "sampler_name": "%sampler_name%",
        "scheduler": "%scheduler%",
        "denoise": 1,
        "model": [
          "27",
          3
        ],
        "positive": [
          "27",
          1
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "19",
          0
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "K\u91C7\u6837\u5668"
      }
    },
    "4": {
      "inputs": {
        "ckpt_name": "%MODEL_NAME%"
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Checkpoint\u52A0\u8F7D\u5668(\u7B80\u6613)"
      }
    },
    "7": {
      "inputs": {
        "text": "%negative_prompt%",
        "speak_and_recognation": true,
        "clip": [
          "27",
          2
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP\u6587\u672C\u7F16\u7801\u5668"
      }
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "4",
          2
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE\u89E3\u7801"
      }
    },
    "19": {
      "inputs": {
        "width": "%width%",
        "height": "%height%",
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "\u7A7ALatent"
      }
    },
    "23": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "\u4FDD\u5B58\u56FE\u50CF"
      }
    },
    "27": {
      "inputs": {
        "positive": "%prompt%",
        "auto_random": false,
        "lora_str": "",
        "temp_str": "",
        "temp_lora_str": "",
        "random_template": "",
        "\u6253\u5F00\u63D0\u793A\u8BCD\u7F16\u8F91\u5668": "",
        "\u6253\u5F00Lora\u5806": "",
        "speak_and_recognation": {
          "__value__": [
            false,
            true
          ]
        },
        "opt_clip": [
          "4",
          1
        ],
        "opt_model": [
          "4",
          0
        ]
      },
      "class_type": "WeiLinPromptUI",
      "_meta": {
        "title": "WeiLin \u5168\u80FD\u63D0\u793A\u8BCD\u7F16\u8F91\u5668"
      }
    }
  }`;

jsonweilinvae = `{
    "3": {
      "inputs": {
        "seed": "%seed%",
        "steps": "%steps%",
        "cfg": "%cfg_scale%",
        "sampler_name": "%sampler_name%",
        "scheduler": "%scheduler%",
        "denoise": 1,
        "model": [
          "27",
          3
        ],
        "positive": [
          "27",
          1
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "19",
          0
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "K\u91C7\u6837\u5668"
      }
    },
    "4": {
      "inputs": {
        "ckpt_name": "%MODEL_NAME%"
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Checkpoint\u52A0\u8F7D\u5668(\u7B80\u6613)"
      }
    },
    "7": {
      "inputs": {
        "text": "%negative_prompt%",
        "speak_and_recognation": true,
        "clip": [
          "27",
          2
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP\u6587\u672C\u7F16\u7801\u5668"
      }
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "31",
          0
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE\u89E3\u7801"
      }
    },
    "19": {
      "inputs": {
        "width": "%width%",
        "height": "%height%",
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "\u7A7ALatent"
      }
    },
    "23": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "\u4FDD\u5B58\u56FE\u50CF"
      }
    },
    "27": {
      "inputs": {
        "positive": "%prompt%",
        "auto_random": false,
        "lora_str": "",
        "temp_str": "",
        "temp_lora_str": "",
        "random_template": "",
        "\u6253\u5F00\u63D0\u793A\u8BCD\u7F16\u8F91\u5668": "",
        "\u6253\u5F00Lora\u5806": "",
        "speak_and_recognation": {
          "__value__": [
            false,
            true
          ]
        },
        "opt_clip": [
          "4",
          1
        ],
        "opt_model": [
          "4",
          0
        ]
      },
      "class_type": "WeiLinPromptUI",
      "_meta": {
        "title": "WeiLin \u5168\u80FD\u63D0\u793A\u8BCD\u7F16\u8F91\u5668"
      }
    },
    "31": {
      "inputs": {
        "vae_name": "%vae%"
      },
      "class_type": "VAELoader",
      "_meta": {
        "title": "\u52A0\u8F7DVAE"
      }
    }
  }`;

jsonvae = `{
    "3": {
      "inputs": {
        "seed": "%seed%",
        "steps": "%steps%",
        "cfg": "%cfg_scale%",
        "sampler_name": "%sampler_name%",
        "scheduler": "%scheduler%",
        "denoise": 1,
        "model": [
          "20",
          0
        ],
        "positive": [
          "20",
          1
        ],
        "negative": [
          "7",
          0
        ],
        "latent_image": [
          "19",
          0
        ]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "K\u91C7\u6837\u5668"
      }
    },
    "4": {
      "inputs": {
        "ckpt_name": "%MODEL_NAME%"
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Checkpoint\u52A0\u8F7D\u5668(\u7B80\u6613)"
      }
    },
    "7": {
      "inputs": {
        "text": "%negative_prompt%",
        "speak_and_recognation": true,
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP\u6587\u672C\u7F16\u7801\u5668"
      }
    },
    "8": {
      "inputs": {
        "samples": [
          "3",
          0
        ],
        "vae": [
          "25",
          0
        ]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE\u89E3\u7801"
      }
    },
    "19": {
      "inputs": {
        "width": "%width%",
        "height": "%height%",
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "\u7A7ALatent"
      }
    },
    "20": {
      "inputs": {
        "positive": "%prompt%",
        "\u6253\u5F00\u53EF\u89C6\u5316PromptUI": "",
        "speak_and_recognation": true,
        "model": [
          "4",
          0
        ],
        "clip": [
          "4",
          1
        ]
      },
      "class_type": "WeiLinComfyUIPromptToLorasOnly",
      "_meta": {
        "title": "WeiLin \u6B63\u5411\u63D0\u793A\u8BCDLora\u81EA\u52A8\u52A0\u8F7D"
      }
    },
    "23": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": [
          "8",
          0
        ]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "\u4FDD\u5B58\u56FE\u50CF"
      }
    },
    "25": {
      "inputs": {
        "vae_name": "%vae%"
      },
      "class_type": "VAELoader",
      "_meta": {
        "title": "\u52A0\u8F7DVAE"
      }
    }
  }`;

runninghubDefaultJson = `{
  "1": {
    "inputs": {
      "unet_name": "minimax_h3_fl2va_int8_convrot.safetensors",
      "weight_dtype": "default"
    },
    "class_type": "UNETLoader",
    "_meta": {
      "title": "Load Diffusion Model"
    }
  },
  "2": {
    "inputs": {
      "lora_name": "minimax_h3_turbo_v4_step600_comfyui_T8-convert.safetensors",
      "strength_model": 1,
      "model": [
        "17",
        0
      ]
    },
    "class_type": "LoraLoaderBypassModelOnly",
    "_meta": {
      "title": "Load LoRA (Bypass, Model Only) (for debugging)"
    }
  },
  "3": {
    "inputs": {
      "clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
      "type": "minimax",
      "device": "default"
    },
    "class_type": "CLIPLoader",
    "_meta": {
      "title": "Load CLIP"
    }
  },
  "4": {
    "inputs": {
      "vae_name": "minimax_h3_video_vae_int8_convrot.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "5": {
    "inputs": {
      "vae_name": "minimax_h3_audio_vae_fp32.safetensors"
    },
    "class_type": "VAELoader",
    "_meta": {
      "title": "Load VAE"
    }
  },
  "6": {
    "inputs": {
      "prompt": "%\u63D0\u793A\u8BCD%",
      "width": [
        "16",
        0
      ],
      "height": [
        "16",
        1
      ],
      "length": [
        "15",
        1
      ],
      "task_type": "Ref2VA",
      "audio_mode": "native",
      "audio_denoise_strength": 1,
      "add_source_as_reference": false,
      "prompt_primary_audio_ordinal": 0,
      "strict_prompt_tags": true,
      "ref_image_size": "match",
      "reference_video_policy": "official_2_to_15s",
      "clip": [
        "3",
        0
      ],
      "video_vae": [
        "4",
        0
      ],
      "audio_vae": [
        "5",
        0
      ],
      "ref_images.ref_image_0": [
        "107",
        0
      ],
      "ref_images.ref_image_1": [
        "108",
        0
      ],
      "ref_images.ref_image_2": [
        "109",
        0
      ],
      "ref_images.ref_image_3": [
        "111",
        0
      ],
      "ref_images.ref_image_4": [
        "113",
        0
      ],
      "ref_images.ref_image_5": [
        "115",
        0
      ],
      "ref_images.ref_image_6": [
        "117",
        0
      ],
      "ref_images.ref_image_7": [
        "119",
        0
      ],
      "ref_images.ref_image_8": [
        "121",
        0
      ],
      "ref_audios.ref_audio_0": [
        "125",
        0
      ],
      "ref_audios.ref_audio_1": [
        "127",
        0
      ],
      "ref_audios.ref_audio_2": [
        "129",
        0
      ]
    },
    "class_type": "MiniMaxH3AudioConditioningT8",
    "_meta": {
      "title": "MiniMax H3 Audio Conditioning (T8)"
    }
  },
  "7": {
    "inputs": {
      "steps": "%\u6B65\u6570%",
      "shift_video": 12,
      "shift_audio": 3,
      "sampler_name": "euler",
      "scheduler": "beta",
      "model": [
        "2",
        0
      ],
      "av_latent": [
        "6",
        1
      ]
    },
    "class_type": "MiniMaxH3DualClockSamplerT8",
    "_meta": {
      "title": "STABLE 4 video / 4 audio"
    }
  },
  "8": {
    "inputs": {
      "model": [
        "7",
        0
      ],
      "conditioning": [
        "6",
        0
      ]
    },
    "class_type": "BasicGuider",
    "_meta": {
      "title": "Basic Guider"
    }
  },
  "9": {
    "inputs": {
      "noise_seed": 133844306525395
    },
    "class_type": "RandomNoise",
    "_meta": {
      "title": "RandomNoise"
    }
  },
  "10": {
    "inputs": {
      "noise": [
        "9",
        0
      ],
      "guider": [
        "8",
        0
      ],
      "sampler": [
        "7",
        1
      ],
      "sigmas": [
        "7",
        2
      ],
      "latent_image": [
        "6",
        1
      ]
    },
    "class_type": "SamplerCustomAdvanced",
    "_meta": {
      "title": "SamplerCustomAdvanced"
    }
  },
  "11": {
    "inputs": {
      "av_latent": [
        "10",
        0
      ],
      "video_vae": [
        "4",
        0
      ],
      "audio_vae": [
        "5",
        0
      ]
    },
    "class_type": "MiniMaxH3AVDecodeT8",
    "_meta": {
      "title": "MiniMax H3 AV Decode (T8)"
    }
  },
  "13": {
    "inputs": {
      "image": "%\u56FE\u72472%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72472"
    }
  },
  "14": {
    "inputs": {
      "value": "%\u89C6\u9891\u79D2\u6570%"
    },
    "class_type": "PrimitiveFloat",
    "_meta": {
      "title": "Float (duration)"
    }
  },
  "15": {
    "inputs": {
      "expression": "max(5, round(a * 24)) + (5 - (max(5, round(a * 24)) % 17)) % 17",
      "values.a": [
        "14",
        0
      ]
    },
    "class_type": "ComfyMathExpression",
    "_meta": {
      "title": "Math Expression"
    }
  },
  "16": {
    "inputs": {
      "aspect_ratio": "16:9 (Widescreen)",
      "megapixels": "%\u50CF\u7D20%",
      "multiple": 32
    },
    "class_type": "ResolutionSelector",
    "_meta": {
      "title": "Resolution Selector"
    }
  },
  "17": {
    "inputs": {
      "model": [
        "1",
        0
      ]
    },
    "class_type": "MiniMaxH3MemoryEfficientSageAttentionPatch",
    "_meta": {
      "title": "MiniMax H3 Memory Efficient Sage Attention Patch"
    }
  },
  "36": {
    "inputs": {
      "image": "%\u56FE\u72471%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72471"
    }
  },
  "48": {
    "inputs": {
      "frame_rate": 24,
      "loop_count": 0,
      "filename_prefix": "MiniMaxH3/stable_4v4a",
      "format": "video/h264-mp4",
      "pix_fmt": "yuv420p",
      "crf": 19,
      "save_metadata": false,
      "trim_to_audio": false,
      "pingpong": false,
      "save_output": true,
      "no_preview": true,
      "images": [
        "11",
        0
      ],
      "audio": [
        "11",
        1
      ]
    },
    "class_type": "VHS_VideoCombine",
    "_meta": {
      "title": "Video Combine \u{1F3A5}\u{1F165}\u{1F157}\u{1F162}"
    }
  },
  "49": {
    "inputs": {
      "zip_filename": "",
      "zip": [
        "48",
        0
      ]
    },
    "class_type": "solarL_SaveImagesToZip",
    "_meta": {
      "title": "\u4FDD\u5B58Zip\u683C\u5F0F"
    }
  },
  "107": {
    "inputs": {
      "Path": "%\u56FE\u72471\u63A7\u5236%",
      "Input_1": [
        "36",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 1 Switch"
    }
  },
  "108": {
    "inputs": {
      "Path": "%\u56FE\u72472\u63A7\u5236%",
      "Input_1": [
        "13",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 2 Switch"
    }
  },
  "109": {
    "inputs": {
      "Path": "%\u56FE\u72473\u63A7\u5236%",
      "Input_1": [
        "110",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 3 Switch"
    }
  },
  "110": {
    "inputs": {
      "image": "%\u56FE\u72473%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72473"
    }
  },
  "111": {
    "inputs": {
      "Path": "%\u56FE\u72474\u63A7\u5236%",
      "Input_1": [
        "112",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 4 Switch"
    }
  },
  "112": {
    "inputs": {
      "image": "%\u56FE\u72474%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72474"
    }
  },
  "113": {
    "inputs": {
      "Path": "%\u56FE\u72475\u63A7\u5236%",
      "Input_1": [
        "114",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 5 Switch"
    }
  },
  "114": {
    "inputs": {
      "image": "%\u56FE\u72475%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72475"
    }
  },
  "115": {
    "inputs": {
      "Path": "%\u56FE\u72476\u63A7\u5236%",
      "Input_1": [
        "116",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 6 Switch"
    }
  },
  "116": {
    "inputs": {
      "image": "%\u56FE\u72476%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72476"
    }
  },
  "117": {
    "inputs": {
      "Path": "%\u56FE\u72477\u63A7\u5236%",
      "Input_1": [
        "118",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 7 Switch"
    }
  },
  "118": {
    "inputs": {
      "image": "%\u56FE\u72477%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72477"
    }
  },
  "119": {
    "inputs": {
      "Path": "%\u56FE\u72478\u63A7\u5236%",
      "Input_1": [
        "120",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 8 Switch"
    }
  },
  "120": {
    "inputs": {
      "image": "%\u56FE\u72478%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72478"
    }
  },
  "121": {
    "inputs": {
      "Path": "%\u56FE\u72479\u63A7\u5236%",
      "Input_1": [
        "122",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u56FE\u50CF 9 Switch"
    }
  },
  "122": {
    "inputs": {
      "image": "%\u56FE\u72479%"
    },
    "class_type": "LoadImage",
    "_meta": {
      "title": "\u52A0\u8F7D\u56FE\u72479"
    }
  },
  "124": {
    "inputs": {
      "audio": "%\u97F3\u98911%",
      "audioUI": ""
    },
    "class_type": "LoadAudio",
    "_meta": {
      "title": "\u97F3\u9891\u52A0\u8F7D1"
    }
  },
  "125": {
    "inputs": {
      "Path": "%\u97F3\u98911\u63A7\u5236%",
      "Input_1": [
        "124",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u97F3\u98911 Switch"
    }
  },
  "127": {
    "inputs": {
      "Path": "%\u97F3\u98912\u63A7\u5236%",
      "Input_1": [
        "131",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u97F3\u98912 Switch"
    }
  },
  "129": {
    "inputs": {
      "Path": "%\u97F3\u98913\u63A7\u5236%",
      "Input_1": [
        "132",
        0
      ]
    },
    "class_type": "Switch",
    "_meta": {
      "title": "\u97F3\u9891 3 Switch"
    }
  },
  "131": {
    "inputs": {
      "audio": "%\u97F3\u98912%",
      "audioUI": ""
    },
    "class_type": "LoadAudio",
    "_meta": {
      "title": "\u97F3\u9891\u52A0\u8F7D2"
    }
  },
  "132": {
    "inputs": {
      "audio": "%\u97F3\u98913%",
      "audioUI": ""
    },
    "class_type": "LoadAudio",
    "_meta": {
      "title": "\u97F3\u9891\u52A0\u8F7D3"
    }
  }
}`;

var __defProp = Object.defineProperty;

var __getOwnPropNames = Object.getOwnPropertyNames;

var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};

var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

export { editwk, json, json2, json3, jsonvae, jsonweilinvae, jsonweldf, runninghubDefaultJson };
