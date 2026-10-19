// 还原自打包产物 — 原始模块: utils/config.js
import { themePresets } from "./settings/themePresets.js";
import { editwk, json, json2, json3, jsonvae, jsonweilinvae, jsonweldf, runninghubDefaultJson } from "./settings/workers.js";
import { defaultTailMessagesConfig, defaultToolCallConfig } from "./settings/defaultToolCallConfig.js";

var EventType, LLMRequestTypes, defaultSettings, defaultThemes, eventNames, extensionFolderPath, extensionName;

extensionName = "st-chatu8";

extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

EventType = {
      GENERATE_IMAGE_REQUEST: "generate-image-request",
      GENERATE_IMAGE_RESPONSE: "generate-image-response"
    };

eventNames = {
      REGEX_TEST_MESSAGE: "regex-st-chatu8-test-message",
      REGEX_RESULT_MESSAGE: "regex-st-chatu8-result-message",
      // LLM 相关事件
      LLM_TEST_RESULT: "ch-llm-test-result",
      LLM_GET_PROMPT_REQUEST: "ch-llm-get-prompt-request",
      LLM_GET_PROMPT_RESPONSE: "ch-llm-get-prompt-response",
      LLM_EXECUTE_REQUEST: "ch-llm-execute-request",
      LLM_EXECUTE_RESPONSE: "ch-llm-execute-response",
      // 四种 LLM 请求类型事件
      // 正文图片生成
      LLM_IMAGE_GEN_REQUEST: "ch-llm-image-gen-request",
      LLM_IMAGE_GEN_RESPONSE: "ch-llm-image-gen-response",
      LLM_IMAGE_GEN_GET_PROMPT_REQUEST: "ch-llm-image-gen-get-prompt-request",
      LLM_IMAGE_GEN_GET_PROMPT_RESPONSE: "ch-llm-image-gen-get-prompt-response",
      // 角色设计和服装设计
      LLM_CHAR_DESIGN_REQUEST: "ch-llm-char-design-request",
      LLM_CHAR_DESIGN_RESPONSE: "ch-llm-char-design-response",
      LLM_CHAR_DESIGN_GET_PROMPT_REQUEST: "ch-llm-char-design-get-prompt-request",
      LLM_CHAR_DESIGN_GET_PROMPT_RESPONSE: "ch-llm-char-design-get-prompt-response",
      // 角色和服装展示
      LLM_CHAR_DISPLAY_REQUEST: "ch-llm-char-display-request",
      LLM_CHAR_DISPLAY_RESPONSE: "ch-llm-char-display-response",
      LLM_CHAR_DISPLAY_GET_PROMPT_REQUEST: "ch-llm-char-display-get-prompt-request",
      LLM_CHAR_DISPLAY_GET_PROMPT_RESPONSE: "ch-llm-char-display-get-prompt-response",
      // 角色/服装修改
      LLM_CHAR_MODIFY_REQUEST: "ch-llm-char-modify-request",
      LLM_CHAR_MODIFY_RESPONSE: "ch-llm-char-modify-response",
      LLM_CHAR_MODIFY_GET_PROMPT_REQUEST: "ch-llm-char-modify-get-prompt-request",
      LLM_CHAR_MODIFY_GET_PROMPT_RESPONSE: "ch-llm-char-modify-get-prompt-response",
      // 翻译请求事件
      LLM_TRANSLATION_REQUEST: "ch-llm-translation-request",
      LLM_TRANSLATION_RESPONSE: "ch-llm-translation-response",
      LLM_TRANSLATION_GET_PROMPT_REQUEST: "ch-llm-translation-get-prompt-request",
      LLM_TRANSLATION_GET_PROMPT_RESPONSE: "ch-llm-translation-get-prompt-response",
      // Tag修改请求事件
      LLM_TAG_MODIFY_REQUEST: "ch-llm-tag-modify-request",
      LLM_TAG_MODIFY_RESPONSE: "ch-llm-tag-modify-response",
      LLM_TAG_MODIFY_GET_PROMPT_REQUEST: "ch-llm-tag-modify-get-prompt-request",
      LLM_TAG_MODIFY_GET_PROMPT_RESPONSE: "ch-llm-tag-modify-get-prompt-response",
      // 人设生成
      LLM_PERSONA_GEN_REQUEST: "ch-llm-persona-gen-request",
      LLM_PERSONA_GEN_RESPONSE: "ch-llm-persona-gen-response",
      LLM_PERSONA_GEN_GET_PROMPT_REQUEST: "ch-llm-persona-gen-get-prompt-request",
      LLM_PERSONA_GEN_GET_PROMPT_RESPONSE: "ch-llm-persona-gen-get-prompt-response",
      // User 人设生成
      LLM_USER_PERSONA_GEN_REQUEST: "ch-llm-user-persona-gen-request",
      LLM_USER_PERSONA_GEN_RESPONSE: "ch-llm-user-persona-gen-response",
      LLM_USER_PERSONA_GEN_GET_PROMPT_REQUEST: "ch-llm-user-persona-gen-get-prompt-request",
      LLM_USER_PERSONA_GEN_GET_PROMPT_RESPONSE: "ch-llm-user-persona-gen-get-prompt-response",
      // 视材准备
      LLM_VISUAL_MAT_PREP_REQUEST: "ch-llm-visual-mat-prep-request",
      LLM_VISUAL_MAT_PREP_RESPONSE: "ch-llm-visual-mat-prep-response",
      LLM_VISUAL_MAT_PREP_GET_PROMPT_REQUEST: "ch-llm-visual-mat-prep-get-prompt-request",
      LLM_VISUAL_MAT_PREP_GET_PROMPT_RESPONSE: "ch-llm-visual-mat-prep-get-prompt-response",
      // 生成视频
      LLM_VIDEO_GEN_REQUEST: "ch-llm-video-gen-request",
      LLM_VIDEO_GEN_RESPONSE: "ch-llm-video-gen-response",
      LLM_VIDEO_GEN_GET_PROMPT_REQUEST: "ch-llm-video-gen-get-prompt-request",
      LLM_VIDEO_GEN_GET_PROMPT_RESPONSE: "ch-llm-video-gen-get-prompt-response",
      // 视频资产生成
      LLM_VIDEO_ASSET_GEN_REQUEST: "ch-llm-video-asset-gen-request",
      LLM_VIDEO_ASSET_GEN_RESPONSE: "ch-llm-video-asset-gen-response",
      LLM_VIDEO_ASSET_GEN_GET_PROMPT_REQUEST: "ch-llm-video-asset-gen-get-prompt-request",
      LLM_VIDEO_ASSET_GEN_GET_PROMPT_RESPONSE: "ch-llm-video-asset-gen-get-prompt-response",
      // TTS 语音合成事件
      TTS_REQUEST: "ch-tts-request",
      TTS_RESPONSE: "ch-tts-response",
      TTS_STOP: "ch-tts-stop",
      TTS_STATE_CHANGED: "ch-tts-state-changed",
      // ASR 语音输入事件
      ASR_START: "ch-asr-start",
      ASR_STOP: "ch-asr-stop",
      ASR_RESULT: "ch-asr-result",
      ASR_STATE_CHANGED: "ch-asr-state-changed",
      ASR_VOLUME: "ch-asr-volume",
      ASR_ERROR: "ch-asr-error",
      // 角色/服装数据外部录入接口
      CHAR_DATA_IMPORT_REQUEST: "ch-char-data-import-request",
      CHAR_DATA_IMPORT_RESPONSE: "ch-char-data-import-response"
    };

LLMRequestTypes = {
      IMAGE_GEN: "image_gen",
      // 正文图片生成
      CHAR_DESIGN: "char_design",
      // 角色设计和服装设计
      CHAR_DISPLAY: "char_display",
      // 角色和服装展示
      CHAR_MODIFY: "char_modify",
      // 角色/服装修改
      TRANSLATION: "translation",
      // 翻译
      TAG_MODIFY: "tag_modify",
      // Tag修改
      AI_ASSISTANT: "ai_assistant",
      // 智绘姬助手（自定义模式）
      PERSONA_GEN: "persona_gen",
      // 角色人设生成
      USER_PERSONA_GEN: "user_persona_gen",
      // User 人设生成
      CHAT_SUMMARY: "chat_summary",
      // 聊天总结
      VISUAL_MAT_PREP: "visual_mat_prep",
      // 视材准备
      VIDEO_GEN: "video_gen",
      // 图生视频
      VIDEO_ASSET_GEN: "video_asset_gen"
      // 视频资产生成
    };

defaultThemes = themePresets;

defaultSettings = {
      theme_id: "\u9ED8\u8BA4-\u591C\u95F4",
      themes: defaultThemes,
      generate_btn_style: "\u9ED8\u8BA4",
      image_frame_style: "\u65E0\u6837\u5F0F",
      collapse_style: "\u9ED8\u8BA4",
      scriptEnabled: false,
      helpTipsEnabled: "true",
      // 设置项帮助提示开关，默认开启
      disablePluginToast: "false",
      // 插件提示关闭（生图开始/结束通知关闭）
      characterAI: { model: "mistral", temperature: 0.8, systemPrompt: "", lastPrompt: "" },
      outfitAI: { model: "mistral", temperature: 0.8, systemPrompt: "", lastPrompt: "" },
      newlineFixEnabled: "true",
      yushe: { "\u9ED8\u8BA4": { "fixedPrompt": "", "fixedPrompt_end": "", "negativePrompt": "" }, "\u5C0F\u9A6C\u6A21\u578B\u9ED8\u8BA4": { "fixedPrompt": "score_9,score_8_up,score_7_up,anime", "fixedPrompt_end": "", "negativePrompt": "score_4,score_3,score_2,score_1,score_5" } },
      yusheid_sd: "\u9ED8\u8BA4",
      yusheid_novelai: "\u9ED8\u8BA4",
      yusheid_comfyui: "\u9ED8\u8BA4",
      yusheid_runninghub: "\u9ED8\u8BA4",
      randomYushe: "false",
      aiAutonomousResolution: true,
      // AI自主分辨率：开启后，从提示词中提取到的尺寸会覆盖设置中的分辨率参数
      videoChannel: "comfyui",
      // 视频渠道选择：none(无) / comfyui / runninghub
      prompt_replace: { "\u9ED8\u8BA4": { "text": "\u89E6\u53D1\u8BCD1=\u524D\u7F6E\u524D|\u63D2\u5165\u8BCD1\n\u89E6\u53D1\u8BCD2=\u524D\u7F6E\u540E|\u63D2\u5165\u8BCD2\n\u89E6\u53D1\u8BCD3=\u66FF\u6362|\u66FF\u6362\u8BCD3\n\u89E6\u53D1\u8BCD4=\u66FF\u6362|\n\u89E6\u53D1\u8BCD5=\u66FF\u6362\u5206\u89D2\u8272|\u66FF\u6362\u8BCD5\n\u89E6\u53D1\u8BCD6=\u540E\u7F6E\u524D|\u63D2\u5165\u8BCD6\n\u89E6\u53D1\u8BCD7=\u540E\u7F6E\u540E|\u63D2\u5165\u8BCD7\n\u89E6\u53D1\u8BCD8=\u6700\u540E\u7F6E|\u63D2\u5165\u8BCD8" } },
      prompt_replace_id: "\u9ED8\u8BA4",
      prompt_replace_id_runninghub: "\u9ED8\u8BA4",
      vibePresets: { "\u9ED8\u8BA4": { model: "nai-diffusion-4-5-curated", infoExtract: 1, strength: 0.6, imageId: null, vibeDataId: null } },
      vibePresetId: "\u9ED8\u8BA4",
      regex_profiles: { "\u9ED8\u8BA4": { beforeAfterRegex: "", textRegex: "" } },
      current_regex_profile: "\u9ED8\u8BA4",
      word_replacement_profiles: {
        "\u9ED8\u8BA4": {
          textReplacement: "\u8089\u68D2=\u{1F952}\n\u5C0F\u7A74=\u{1F338}\n\u5973\u5B69=\u2640\u{1F476}\u{1F3FB}\n\u5C11\u5973=\u2640\u{1F9D2}\u{1F3FB}\n\u7537\u5B69=\u2642\u{1F476}\u{1F3FB}\n\u6B63\u592A=\u2642\u{1F476}\u{1F3FB}\n\u5C0F\u5B69\u5B50=\u{1F467}\u{1F3FB}\n\u4E71\u4F26=\u26A0\uFE0F\u{1F498}\n\u8272\u60C5=\u{1F51E}\n\u5C81=\u{1F384}\n\u5C0F\u5B66=\u{1F3EC}\n\u5C0F\u5B66\u751F=\u{1F9D2}\u{1F3FB}\n\u5973\u513F=\u{1F467}\u{1F3FC}\n\u513F\u5B50=\u{1F466}\u{1F3FC}\n\u841D\u8389=\u2640\u{1F476}\u{1F3FB}\n\u5E7C\u5973=\u2640\u{1F476}\u{1F3FB}\n\u841D\u8389=\u2640\u{1F476}\u{1F3FB}",
          aiReplacement: "sf_=\ns\u0101fe&="
        }
      },
      current_word_replacement_profile: "\u9ED8\u8BA4",
      regexTestMode: false,
      mode: "comfyui",
      client: "browser",
      cache: "1",
      sdUrl: "http://localhost:7860",
      st_chatu8_sd_auth: "",
      comfyuiUrl: "http://localhost:8188",
      comfyui_max_concurrency: 10,
      comfyui_timeout: 1800,
      // RunningHub 配置
      runninghub_apiKey: "",
      runninghub_workflowId: "",
      runninghub_instance_type: "default",
      runninghub_retain_seconds: "",
      runninghub_model: "",
      runninghub_sampler_name: "euler",
      runninghub_vae: "",
      runninghub_scheduler: "normal",
      runninghub_clip_name: "",
      runninghub_custom_models: [
        "v1-5-pruned-emaonly.safetensors",
        "sd_xl_base_1.0.safetensors",
        "flux1-dev.safetensors",
        "flux1-schnell.safetensors",
        "animagine-xl-3.1.safetensors",
        "Illustrious-XL-v0.1.safetensors"
      ],
      runninghub_custom_samplers: [
        "euler",
        "euler_ancestral",
        "heun",
        "dpm_2",
        "dpm_2_ancestral",
        "lms",
        "dpm_fast",
        "dpm_adaptive",
        "dpmpp_2s_ancestral",
        "dpmpp_sde",
        "dpmpp_2m",
        "dpmpp_2m_sde",
        "dpmpp_3m_sde",
        "ddim",
        "uni_pc",
        "uni_pc_bh2"
      ],
      runninghub_custom_vaes: [
        "vae-ft-mse-840000-ema-pruned.safetensors",
        "sdxl_vae.safetensors",
        "ae.safetensors",
        "taesd.safetensors"
      ],
      runninghub_custom_schedulers: [
        "normal",
        "karras",
        "exponential",
        "sgm_uniform",
        "simple",
        "ddim_uniform",
        "beta"
      ],
      runninghub_custom_clips: [
        "clip_l.safetensors",
        "clip_g.safetensors",
        "t5xxl_fp16.safetensors",
        "t5xxl_fp8_e4m3fn.safetensors"
      ],
      runninghub_size: "1024x1024",
      runninghub_width: "1024",
      runninghub_height: "1024",
      runninghub_steps: "20",
      runninghub_seed: "-1",
      runninghub_cfg: "7",
      runninghub_val_duration: "4",
      runninghub_val_steps: "6",
      runninghub_val_megapixels: "0.9",
      runninghub_val_seed: "-1",
      runninghub_val_default_img: "09baa6b5a6d1b6afa83aaad55c7261c9a413f9bdfdea045c49efb5f3303165fa.jpg",
      runninghub_val_default_aud: "eded6ff68fe3fda18f0f31ecfbb1ff6b7494c2d17ff35b32d3a5ad7ccecf03f4.m4a",
      runninghub_img_ctrl_1: "bypass",
      runninghub_img_ctrl_2: "bypass",
      runninghub_img_ctrl_3: "bypass",
      runninghub_img_ctrl_4: "bypass",
      runninghub_img_ctrl_5: "bypass",
      runninghub_img_ctrl_6: "bypass",
      runninghub_img_ctrl_7: "bypass",
      runninghub_img_ctrl_8: "bypass",
      runninghub_img_ctrl_9: "bypass",
      runninghub_aud_ctrl_1: "bypass",
      runninghub_aud_ctrl_2: "bypass",
      runninghub_aud_ctrl_3: "bypass",
      runninghub_img_desc_1: "",
      runninghub_img_desc_2: "",
      runninghub_img_desc_3: "",
      runninghub_img_desc_4: "",
      runninghub_img_desc_5: "",
      runninghub_img_desc_6: "",
      runninghub_img_desc_7: "",
      runninghub_img_desc_8: "",
      runninghub_img_desc_9: "",
      runninghub_aud_desc_1: "",
      runninghub_aud_desc_2: "",
      runninghub_aud_desc_3: "",
      runninghub_uploadedMedia: { img: {}, aud: {} },
      runninghub_upload_cache: {},
      runninghub_profile_id: "\u9ED8\u8BA4",
      runninghub_profiles: { "\u9ED8\u8BA4": {} },
      runninghub_workers: {
        "\u9ED8\u8BA4-MiniMax\u89C6\u9891": runninghubDefaultJson
      },
      runninghub_workflow_ids: {
        "\u9ED8\u8BA4-MiniMax\u89C6\u9891": ""
      },
      runninghub_workerid: "\u9ED8\u8BA4-MiniMax\u89C6\u9891",
      runninghub_worker: runninghubDefaultJson,
      runninghub_img2vid_workerid: "\u9ED8\u8BA4-MiniMax\u89C6\u9891",
      runninghub_img2vid_worker: runninghubDefaultJson,
      runninghub_img2vid_workflowId: "",
      runninghub_ref2vid_workerid: "\u9ED8\u8BA4-MiniMax\u89C6\u9891",
      runninghub_ref2vid_worker: runninghubDefaultJson,
      runninghub_ref2vid_workflowId: "",
      runninghub_video_test_demand: "",
      runninghub_video_test_prompt: "",
      // ComfyUI 视频配置
      comfyui_val_duration: "4",
      comfyui_val_steps: "20",
      comfyui_val_megapixels: "0.9",
      comfyui_val_seed: "-1",
      comfyui_val_default_img: "",
      comfyui_val_default_aud: "",
      comfyui_img_ctrl_1: "bypass",
      comfyui_img_ctrl_2: "bypass",
      comfyui_img_ctrl_3: "bypass",
      comfyui_img_ctrl_4: "bypass",
      comfyui_img_ctrl_5: "bypass",
      comfyui_img_ctrl_6: "bypass",
      comfyui_img_ctrl_7: "bypass",
      comfyui_img_ctrl_8: "bypass",
      comfyui_img_ctrl_9: "bypass",
      comfyui_aud_ctrl_1: "bypass",
      comfyui_aud_ctrl_2: "bypass",
      comfyui_aud_ctrl_3: "bypass",
      comfyui_img_desc_1: "",
      comfyui_img_desc_2: "",
      comfyui_img_desc_3: "",
      comfyui_img_desc_4: "",
      comfyui_img_desc_5: "",
      comfyui_img_desc_6: "",
      comfyui_img_desc_7: "",
      comfyui_img_desc_8: "",
      comfyui_img_desc_9: "",
      comfyui_aud_desc_1: "",
      comfyui_aud_desc_2: "",
      comfyui_aud_desc_3: "",
      comfyui_upload_cache: {},
      video_assets: [],
      video_asset_gen_demand: "",
      video_asset_gen_reply: "",
      video_asset_gen_attachments: [],
      comfyui_video_workers: {
        "\u9ED8\u8BA4-\u89C6\u9891\u5DE5\u4F5C\u6D41": runninghubDefaultJson
      },
      comfyui_img2vid_workerid: "\u9ED8\u8BA4-\u89C6\u9891\u5DE5\u4F5C\u6D41",
      comfyui_img2vid_worker: runninghubDefaultJson,
      comfyui_ref2vid_workerid: "\u9ED8\u8BA4-\u89C6\u9891\u5DE5\u4F5C\u6D41",
      comfyui_ref2vid_worker: runninghubDefaultJson,
      comfyui_video_test_demand: "",
      comfyui_video_test_prompt: "",
      novelaiApi: "000000",
      novelaiApi_id: "000000",
      startTag: "image###",
      endTag: "###",
      nai3Scale: "10",
      sdCfgScale: "7",
      sm: "true",
      dyn: "true",
      cfg_rescale: "0.18",
      AQT_sd: "best quality, amazing quality, very aesthetic, absurdres",
      UCP_sd: "bad proportions, out of focus, username, text, bad anatomy, lowres, worstquality, watermark, cropped, bad body, deformed, mutated, disfigured, poorly drawn face, malformed hands, extra arms, extra limb, missing limb, too many fingers, extra legs, bad feet, missing fingers, fused fingers, acnes, floating limbs, disconnected limbs, long neck, long body, mutation, ugly, blurry, low quality, sketches, normal quality, monochrome, grayscale, signature, logo, jpeg artifacts, unfinished, displeasing, chromatic aberration, extra digits, artistic error, scan, abstract, photo, realism, screencap",
      AQT_novelai: "best quality, amazing quality, very aesthetic, absurdres",
      UCP_novelai: "Heavy",
      addFurryDataset: "false",
      AQT_comfyui: "best quality, amazing quality, very aesthetic, absurdres",
      UCP_comfyui: "bad proportions, out of focus, username, text, bad anatomy, lowres, worstquality, watermark, cropped, bad body, deformed, mutated, disfigured, poorly drawn face, malformed hands, extra arms, extra limb, missing limb, too many fingers, extra legs, bad feet, missing fingers, fused fingers, acnes, floating limbs, disconnected limbs, long neck, long body, mutation, ugly, blurry, low quality, sketches, normal quality, monochrome, grayscale, signature, logo, jpeg artifacts, unfinished, displeasing, chromatic aberration, extra digits, artistic error, scan, abstract, photo, realism, screencap",
      AQT_runninghub: "best quality, amazing quality, very aesthetic, absurdres",
      UCP_runninghub: "bad proportions, out of focus, username, text, bad anatomy, lowres, worstquality, watermark, cropped, bad body, deformed, mutated, disfigured, poorly drawn face, malformed hands, extra arms, extra limb, missing limb, too many fingers, extra legs, bad feet, missing fingers, fused fingers, acnes, floating limbs, disconnected limbs, long neck, long body, mutation, ugly, blurry, low quality, sketches, normal quality, monochrome, grayscale, signature, logo, jpeg artifacts, unfinished, displeasing, chromatic aberration, extra digits, artistic error, scan, abstract, photo, realism, screencap",
      sd_csteps: "28",
      sd_cwidth: "1024",
      sd_cheight: "1024",
      sd_cseed: "-1",
      novelai_steps: "28",
      novelai_width: "1024",
      novelai_height: "1024",
      novelai_seed: "0",
      comfyui_steps: "28",
      comfyui_width: "1024",
      comfyui_height: "1024",
      comfyui_seed: "0",
      // ComfyUI 局部重绘配置
      inpaint_denoise: "0.75",
      // 新版weilin节点的lora报错修复
      weilin_lora_fix: "false",
      inpaint_brush_size: 30,
      inpaint_positive_prompt: "",
      // 局部重绘正面提示词
      inpaint_negative_prompt: "",
      // 局部重绘负面提示词
      cfg_comfyui: "6",
      sd_cchatu_8_model: "\u8FDE\u63A5\u540E\u9009\u62E9",
      sd_cchatu_8_vae: "Automatic",
      sd_cchatu_8_scheduler: "\u8FDE\u63A5\u540E\u9009\u62E9",
      sd_cchatu_8_upscaler: "Latent",
      sd_cupscale_factor: "1",
      sd_chires_fix: "false",
      sd_chires_steps: "0",
      sd_cdenoising_strength: "0.7",
      sd_cclip_skip: "2",
      sd_cadetailer: "false",
      restoreFaces: "false",
      sd_cchatu_8_samplerName: "DPM++ 2M",
      comfyuisamplerName: "\u8FDE\u63A5\u540E\u9009\u62E9",
      comfyuiCLIPName: "\u8FDE\u63A5\u540E\u9009\u62E9",
      comfyui_scheduler: "\u8FDE\u63A5\u540E\u9009\u62E9",
      comfyui_vae: "\u8FDE\u63A5\u540E\u9009\u62E9",
      novelai_sampler: "k_euler",
      zidongdianji: "false",
      zidongdianji2: "false",
      longPressToEdit: "false",
      clickToPreview: "true",
      nai3VibeTransfer: "false",
      enableVibeGroupTransfer: "false",
      randomVibeGroup: "false",
      normalizeRefStrength: "false",
      nai3CharRef: "false",
      nai3StylePerception: "false",
      InformationExtracted: "0.3",
      ReferenceStrength: "0.6",
      nai3Deceisp: "true",
      nai3Variety: "true",
      Schedule: "karras",
      MODEL_NAME: "\u8FDE\u63A5\u540E\u9009\u62E9",
      c_fenwei: "0.8",
      c_xijie: "0.8",
      c_idquanzhong: "1.10",
      c_quanzhong: "0.8",
      ipa: "STANDARD (medium strength)",
      dbclike: "false",
      collapseImage: "false",
      workers: {
        "\u9ED8\u8BA4": json,
        "\u9ED8\u8BA4-\u72EC\u7ACBVAE": jsonvae,
        "\u9ED8\u8BA4\u4EBA\u7269\u4E00\u81F4": json2,
        "\u9762\u90E8\u7EC6\u5316": json3,
        "\u65B0\u7248\u9ED8\u8BA4": jsonweldf,
        "\u65B0weilin-vae": jsonweilinvae,
        "\u56FE\u50CF\u7F16\u8F91": editwk
      },
      workerid: "\u65B0\u7248\u9ED8\u8BA4",
      worker: jsonweldf,
      // 修图预设配置
      editWorkerid: "\u56FE\u50CF\u7F16\u8F91",
      editWorker: editwk,
      novelaimode: "nai-diffusion-4-5-full",
      novelai_straight_alpha: false,
      novelai_v5_effort: "high",
      novelaisite: "\u5B98\u7F51",
      novelaiOtherSite: "http://localhost:9696/get-new-token",
      enableCloudQueue: "false",
      cloudQueueUrl: "https://st-chatu-novelai-queue.hf.space",
      cloudQueueGreeting: "\u52AA\u529B\u751F\u6210\u4E2D~",
      cloudQueueTimeout: 180,
      // 云端排队最大等待超时时间（秒），默认 180
      showQueueGreeting: "true",
      displayMode: "\u9ED8\u8BA4",
      heavyFrontendMode: "false",
      insertOriginalText: "false",
      tagthinkEcho: "false",
      // tagthink回显：是否在图片标签前显示思考内容（不含regex行）
      historyKeepImageTag: false,
      // 仅对生图请求生效：历史消息中保留 <image> 标签原文作为参考（当前正文仍按正则清理）
      enablePregen: "false",
      autoLLMImageGen: "false",
      // 自动LLM请求生图
      imageAlignment: "center",
      // 图片对齐方式：left（靠左）、center（居中）、right（靠右）
      imageSizeScale: "100",
      // 图片显示大小：100（自适应）、75（3/4）、50（1/2）、25（1/4）
      imageGenInterval: 100,
      // 生图间隔时间（毫秒），默认为 0（无延迟）
      ai_temperature: 1,
      ai_top_p: 1,
      ai_presence_penalty: 0,
      ai_frequency_penalty: 0,
      ai_stream: "false",
      ai_private: "true",
      ai_token: "",
      ai_test_system: "You are a helpful assistant.",
      ai_test_user: "What is the capital of France?",
      ai_test_output: "",
      // 智绘姬专属配置
      chatu8_ai_assistant: {
        api_url: "",
        api_key: "",
        model: "mistral",
        bypass_proxy: false,
        // 默认使用酒馆代理
        use_tool_call: true,
        // 默认使用 Tool Call 形式
        stream: true,
        // 默认开启流式
        system_prompt: "\u4F60\u662F\u667A\u7ED8\u59EC\uFF0C\u4E00\u4E2A\u53EF\u7231\u3001\u806A\u660E\u7684AI\u52A9\u624B\uFF0C\u8BF7\u7528\u4E2D\u6587\u7B80\u77ED\u5730\u56DE\u7B54\u7528\u6237\u7684\u95EE\u9898\u3002"
      },
      // 智绘姬编号（初次使用时生成）
      chatu8_code: "",
      // 存储智绘姬编号，如 "A3B9"
      // ASR 语音输入配置
      asr: {
        enabled: false,
        // 默认关闭，用户手动开启
        asrServerUrl: "https://qwen-qwen3-asr-demo.ms.show",
        mode: "vad",
        // vad=自动检测 / ptt=按住说话
        silenceTimeout: 1200,
        // 静音超时 ms（500-3000）
        vadThreshold: 0.02,
        // VAD 灵敏度（0.005-0.1）
        maxKeepDuration: 10,
        // 最大保留时长 秒，截取末尾N秒（5-60）
        language: "auto",
        // 识别语言
        appendMode: true,
        // true=追加 false=替换
        autoSend: true,
        // 识别后是否自动发送（false=仅填入输入框不发送）
        conversationMode: false
        // 多轮对话模式：自动发送+自动禁音+自动重新录音
      },
      // 资料库功能（新版：引用酒馆世界书，与 send_data 的 worldBookConfig 完全独立）
      knowledgeBaseConfig: {
        enabled: false,
        triggerDepth: 1,
        // 触发深度：0=只用最后用户消息，N=向上再取N条历史消息
        worldBookSelections: {},
        worldEntrySelections: {}
      },
      llm_history_depth: 2,
      // 发送历史层数，0表示不发送历史
      // 生图生涯统计
      imageGenStats: {
        backends: {
          sd: { success: 0, fail: 0 },
          comfyui: { success: 0, fail: 0 },
          banana: { success: 0, fail: 0 },
          novelai: { success: 0, fail: 0 }
        },
        total: { success: 0, fail: 0 },
        firstGenTime: null,
        lastGenTime: null,
        daily: {}
      },
      llm_profiles: {
        "\u9ED8\u8BA4": {
          api_url: "",
          api_key: "",
          model: "",
          temperature: 1,
          enable_temperature: true,
          top_p: 1,
          enable_top_p: true,
          max_tokens: 3e4,
          enable_max_tokens: true,
          stream: false,
          bypass_proxy: false,
          // 不通过酒馆代理，默认 false（使用代理）
          merge_system_user: false,
          send_images: false,
          custom_headers: "",
          enable_custom_headers: false,
          custom_body_params: "",
          enable_custom_body_params: false,
          // 渠道类型：'openai' 或 'vertex'
          channel_type: "openai",
          vertex_credentials: null,
          vertex_location: "us-central1",
          vertex_model: "gemini-2.5-flash"
        }
      },
      current_llm_profile: "\u9ED8\u8BA4",
      // 全局自定义 Tool 工具配置 (CUSTOM_TOOL_ENABLED) - 独立于 LLM Profile
      tool_call_config: JSON.parse(JSON.stringify(defaultToolCallConfig)),
      // 全局发送前末尾自定义多 Role 消息配置 (CUSTOM_TAIL_MESSAGES_ENABLED) - 独立于 LLM Profile
      tail_messages_config: JSON.parse(JSON.stringify(defaultTailMessagesConfig)),
      // 请求类型档案管理 - 保存多套请求类型配置方案
      llm_request_type_profiles: {
        "\u9ED8\u8BA4": {
          image_gen: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          char_design: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          char_display: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          char_modify: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          translation: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          tag_modify: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          ai_assistant: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          persona_gen: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          user_persona_gen: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          chat_summary: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          visual_mat_prep: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          video_gen: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" },
          video_asset_gen: { api_profile: "\u9ED8\u8BA4", context_profile: "\u9ED8\u8BA4" }
        }
      },
      current_llm_request_type_profile: "\u9ED8\u8BA4",
      // 四种请求类型的配置 - 通过选择预设来配置
      llm_request_type_configs: {
        // 正文图片生成
        image_gen: {
          api_profile: "\u9ED8\u8BA4",
          // 选择的 LLM API 配置预设名称
          context_profile: "\u9ED8\u8BA4"
          // 选择的测试上下文预设名称
        },
        // 角色设计和服装设计
        char_design: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 角色和服装展示
        char_display: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 角色/服装修改
        char_modify: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 翻译
        translation: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // Tag修改
        tag_modify: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 智绘姬助手（自定义模式）
        ai_assistant: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 人设生成
        persona_gen: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // User 人设生成
        user_persona_gen: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 聊天总结
        chat_summary: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 视材准备
        visual_mat_prep: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 生成视频
        video_gen: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        },
        // 视频资产生成
        video_asset_gen: {
          api_profile: "\u9ED8\u8BA4",
          context_profile: "\u9ED8\u8BA4"
        }
      },
      // 测试上下文配置(独立于LLM配置) - 新版本使用条目列表
      test_context_profiles: {
        "\u9ED8\u8BA4": {
          entries: [
            {
              id: "entry_1",
              name: "\u7CFB\u7EDF\u63D0\u793A",
              role: "system",
              // 'system' | 'user' | 'assistant'
              content: "",
              enabled: true,
              triggerMode: "always",
              // 'always' | 'trigger'
              triggerWords: "",
              // 触发词（逗号分隔），仅在 triggerMode 为 'trigger' 时使用
              andTriggerWords: ""
              // 并列触发词（逗号分隔）
            }
          ]
        }
      },
      current_test_context_profile: "\u9ED8\u8BA4",
      // 翻译设置
      translation_model: "mistral",
      translation_system_prompt: '\u4F60\u662F\u6807\u7B7E\u7FFB\u8BD1\u52A9\u624B\u3002\u5C06\u8F93\u5165\u7684\u82F1\u6587\u6807\u7B7E\u7FFB\u8BD1\u6210\u4E2D\u6587\u3002\n\n\u8F93\u51FA\u683C\u5F0F\uFF1AJSON\u5BF9\u8C61 {"\u82F1\u6587":"\u4E2D\u6587", ...}\n\n\u89C4\u5219\uFF1A\n1. \u4FDD\u6301\u8F93\u5165\u987A\u5E8F\n2. \u53EA\u8F93\u51FAJSON\uFF0C\u4E0D\u52A0\u4EFB\u4F55\u89E3\u91CA\n3. \u786E\u4FDDJSON\u683C\u5F0F\u6B63\u786E\n\n\u793A\u4F8B\uFF1A\n\u8F93\u5165\uFF1A1girl, long hair, blue eyes\n\u8F93\u51FA\uFF1A{"1girl":"\u4E00\u4E2A\u5973\u5B69","long hair":"\u957F\u53D1","blue eyes":"\u84DD\u8272\u773C\u775B"}',
      AI_use_coords: "true",
      // 悬浮球主题预设
      fabThemes: {
        "\u81EA\u5B9A\u4E49": {
          bgColor: "#ADD8E6",
          iconColor: "#FFFFFF",
          opacity: 1
        },
        "\u5929\u7A7A\u84DD": {
          bgColor: "#87CEEB",
          iconColor: "#FFFFFF",
          opacity: 0.9
        },
        "\u8584\u8377\u7EFF": {
          bgColor: "#98FB98",
          iconColor: "#2F4F4F",
          opacity: 0.85
        },
        "\u6A31\u82B1\u7C89": {
          bgColor: "#FFB7C5",
          iconColor: "#FFFFFF",
          opacity: 0.9
        },
        "\u6697\u591C\u7D2B": {
          bgColor: "#6A5ACD",
          iconColor: "#FFFFFF",
          opacity: 0.85
        },
        "\u7425\u73C0\u6A59": {
          bgColor: "#FFBF00",
          iconColor: "#4A3728",
          opacity: 0.9
        },
        "\u6DF1\u9083\u9ED1": {
          bgColor: "#2C3E50",
          iconColor: "#ECF0F1",
          opacity: 0.9
        },
        "\u73BB\u7483\u6001": {
          bgColor: "#FFFFFF",
          iconColor: "#333333",
          opacity: 0.5
        },
        "\u8367\u5149\u7EFF": {
          bgColor: "#39FF14",
          iconColor: "#000000",
          opacity: 0.8
        },
        "\u73AB\u7470\u91D1": {
          bgColor: "#B76E79",
          iconColor: "#FFFFFF",
          opacity: 0.9
        }
      },
      chatu8_fab_theme: "\u81EA\u5B9A\u4E49",
      enable_chatu8_fab: true,
      enable_chatu8_fab_video: false,
      // 默认禁用视频模式
      enable_chatu8_desktop_pet: false,
      // 默认禁用独立窗口模式（需要 Electron 环境）
      chatu8_fab_bg_color: "#ADD8E6",
      chatu8_fab_icon_color: "#FFFFFF",
      chatu8_fab_icon_image_id: "",
      chatu8_fab_opacity: 1,
      chatu8_fab_size: {
        desktop: 50,
        mobile: 40
      },
      chatu8_fab_position: {
        desktop: { top: "65vh", left: "20px" },
        mobile: { top: "80vh", left: "10px" }
      },
      chatu8_fab_video_paths: {
        idle: `${extensionFolderPath}/html/settings/idle.chatu8`,
        dragging: `${extensionFolderPath}/html/settings/dragging.chatu8`
      },
      lastTab: "main",
      // comfyuiCache 和 sdCache 已迁移到 configDatabase 独立存储
      // 不再存储在 settings.json 中以减小文件体积
      cacheStorageMigrated: false,
      // 标记是否已完成迁移
      worldBookEnabled: "false",
      worldBookList: { "\u9ED8\u8BA4\u6DFB\u52A0\u672B\u5C3E": { "content": "" } },
      worldBookList_id: "\u9ED8\u8BA4\u6DFB\u52A0\u672B\u5C3E",
      vocabulary_search_startswith: "false",
      vocabulary_search_limit: 100,
      vocabulary_search_sort: "hot_desc",
      jiuguanchucun: "false",
      vibeJiuguanchucun: "true",
      convertToJpegStorage: "false",
      jiuguanStorage: {},
      banana: {
        apiKey: "123456",
        apiUrl: "http://localhost:8008",
        model: "",
        editModel: "",
        videoModel: "",
        aspectRatio: "1:1",
        imageSize: "1024x1024",
        useGrokFormat: "false",
        grokEndpointType: "auto",
        grokRefImageParam: "auto",
        grokCustomEndpoint: "",
        grokGenerationsEndpoint: "",
        grokEditsEndpoint: "",
        grokEditsFormat: "form_data",
        grokResponseFormat: "none",
        conversationPresetId: "\u9ED8\u8BA4",
        editPresetId: "\u9ED8\u8BA4",
        videoPresetId: "\u9ED8\u8BA4",
        conversationPresets: {
          "\u9ED8\u8BA4": {
            fixedPrompt: "",
            postfixPrompt: "",
            conversation: [
              { user: { text: "", image: "" }, model: { text: "", image: "" } },
              { user: { text: "", image: "" }, model: { text: "", image: "" } },
              { user: { text: "", image: "" }, model: { text: "", image: "" } }
            ]
          }
        },
        // Banana 专属替换词设置
        prompt_replace: { "\u9ED8\u8BA4": { "text": "\u89E6\u53D1\u8BCD1=\u524D\u7F6E\u524D|\u63D2\u5165\u8BCD1\n\u89E6\u53D1\u8BCD2=\u524D\u7F6E\u540E|\u63D2\u5165\u8BCD2\n\u89E6\u53D1\u8BCD3=\u66FF\u6362|\u66FF\u6362\u8BCD3" } },
        prompt_replace_id: "\u9ED8\u8BA4"
      },
      bananaCharacterPresets: {
        "\u9ED8\u8BA4": {
          triggers: "\u89E6\u53D1\u8BCD1|\u89E6\u53D1\u8BCD2",
          conversation: {
            user: { text: "", image: "" },
            model: { text: "", image: "" }
          }
        }
      },
      bananaCharacterPresetId: "\u9ED8\u8BA4",
      gestureEnabled: false,
      clickTriggerEnabled: true,
      gesture1: [
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1111111111",
        "1111111111",
        "0000000000"
      ],
      gesture2: [
        "0000000000",
        "1111111111",
        "1111111111",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000",
        "1100000000"
      ],
      gestureShowRecognition: true,
      gestureShowTrail: true,
      gestureTrailColor: "#00ff00",
      gestureMatchThreshold: 60,
      defaultCharDemand: "",
      defaultImageDemand: "",
      visualPrepDemandEnabled: false,
      defaultVisualPrepDemand: "",
      current_demand_profile: "\u9ED8\u8BA4",
      demand_profiles: {
        "\u9ED8\u8BA4": {
          defaultCharDemand: "",
          defaultImageDemand: "",
          defaultVisualPrepDemand: ""
        }
      },
      // NovelAI 配置档案
      novelai_profiles: {
        "\u9ED8\u8BA4": {
          // NovelAI 设置
          novelaiApi: "000000",
          novelaisite: "\u5B98\u7F51",
          novelaiOtherSite: "",
          enableCloudQueue: "false",
          cloudQueueUrl: "",
          cloudQueueGreeting: "",
          cloudQueueTimeout: 180,
          showQueueGreeting: "true",
          novelaimode: "nai-diffusion-4-5-full",
          novelai_straight_alpha: false,
          novelai_sampler: "k_euler",
          Schedule: "karras",
          nai3Scale: "10",
          cfg_rescale: "0.18",
          AI_use_coords: "true",
          sm: "true",
          dyn: "true",
          nai3Variety: "true",
          nai3Deceisp: "true",
          // Vibe Transfer
          enableVibeGroupTransfer: "false",
          randomVibeGroup: "false",
          normalizeRefStrength: "false",
          // 生成参数
          novelai_width: "1024",
          novelai_height: "1024",
          novelai_steps: "28",
          novelai_seed: "0",
          novelai_model_configs: {}
        }
      },
      novelai_profile_id: "\u9ED8\u8BA4",
      novelai_model_configs: {},
      // ComfyUI 配置档案
      comfyui_profiles: {
        "\u9ED8\u8BA4": {
          // 工作流
          workerid: "\u65B0\u7248\u9ED8\u8BA4",
          worker: "",
          // 修图预设
          editWorkerid: "\u65B0\u7248\u9ED8\u8BA4",
          editWorker: "",
          // ComfyUI 设置
          comfyuiUrl: "http://localhost:8188",
          // 其他设置
          MODEL_NAME: "\u8FDE\u63A5\u540E\u9009\u62E9",
          comfyuisamplerName: "\u8FDE\u63A5\u540E\u9009\u62E9",
          comfyui_vae: "\u8FDE\u63A5\u540E\u9009\u62E9",
          comfyui_scheduler: "\u8FDE\u63A5\u540E\u9009\u62E9",
          comfyuiCLIPName: "\u8FDE\u63A5\u540E\u9009\u62E9",
          // 生成参数
          comfyui_width: "1024",
          comfyui_height: "1024",
          comfyui_steps: "28",
          comfyui_seed: "0",
          cfg_comfyui: "6"
        }
      },
      comfyui_profile_id: "\u9ED8\u8BA4"
    };

export { EventType, LLMRequestTypes, defaultSettings, defaultThemes, eventNames, extensionFolderPath, extensionName };
