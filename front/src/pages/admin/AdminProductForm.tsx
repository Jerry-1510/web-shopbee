import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productApi } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { CATEGORIES } from "../../utils/mockData";
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Package,
  DollarSign,
  Layers,
  AlertCircle,
  Upload,
  Video,
  X,
  Sparkles,
  Palette,
  Ruler,
  Info,
  CheckCircle2,
} from "lucide-react";
import { GlassListSkeleton } from "../../components/GlassLoader";

type ProductFormState = {
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  images: string[];
  videos: string[];
  category: string;
  isMall: boolean;
  stock: number;
  description: string;
  detailSpecs: { label: string; value: string }[];
  optionGroups: { name: string; values: string[] }[];
};

type VariantDraftState = {
  enableStyle: boolean;
  styleValues: string[];
  styleInput: string;
  enableColor: boolean;
  colorValues: string[];
  colorInput: string;
  enableCustom: boolean;
  customName: string;
  customValues: string[];
  customInput: string;
};

type ProductDraftPayload = {
  product: ProductFormState;
  variantDraft: VariantDraftState;
  newImageUrl: string;
  newVideoUrl: string;
  savedAt: number;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
};

const AdminProductForm = () => {
  const MOBILE_STICKY_OFFSET = 120;
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [variantDraft, setVariantDraft] = useState<VariantDraftState>({
    enableStyle: false,
    styleValues: [],
    styleInput: "",
    enableColor: false,
    colorValues: [],
    colorInput: "",
    enableCustom: false,
    customName: "",
    customValues: [],
    customInput: "",
  });
  const [product, setProduct] = useState<ProductFormState>({
    name: "",
    price: 0,
    originalPrice: 0,
    discount: 0,
    image: "",
    images: [],
    videos: [],
    category: CATEGORIES[0].name,
    isMall: false,
    stock: 0,
    description: "",
    detailSpecs: [],
    optionGroups: [],
  });
  const draftKey = "admin-product-form-draft-v1";
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const draftLoadedRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const stockInputRef = useRef<HTMLInputElement | null>(null);
  const imageSectionRef = useRef<HTMLDivElement | null>(null);
  const customNameInputRef = useRef<HTMLInputElement | null>(null);
  const basicSectionRef = useRef<HTMLDivElement | null>(null);
  const priceSectionRef = useRef<HTMLDivElement | null>(null);
  const mediaSectionRef = useRef<HTMLDivElement | null>(null);
  const variantSectionRef = useRef<HTMLDivElement | null>(null);
  const sectionTabsRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState<
    "basic" | "price" | "media" | "variant"
  >("basic");
  const totalVariantValues =
    variantDraft.styleValues.length +
    variantDraft.colorValues.length +
    variantDraft.customValues.length;
  const estimatedDiscount = useMemo(() => {
    if (!product.originalPrice || product.originalPrice <= 0) return 0;
    if (product.price >= product.originalPrice) return 0;
    return Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100,
    );
  }, [product.originalPrice, product.price]);
  const formCompletion = useMemo(() => {
    let score = 0;
    if (product.name.trim()) score += 20;
    if (product.description.trim()) score += 15;
    if (product.price > 0) score += 20;
    if (product.stock >= 0) score += 10;
    if (product.images.length > 0 || product.image) score += 20;
    if (totalVariantValues > 0) score += 15;
    return Math.min(100, score);
  }, [
    product.name,
    product.description,
    product.price,
    product.stock,
    product.images.length,
    product.image,
    totalVariantValues,
  ]);
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!product.name.trim()) {
      issues.push("Nhập tên sản phẩm.");
    }
    if (product.price <= 0) {
      issues.push("Giá bán phải lớn hơn 0.");
    }
    if (product.stock < 0) {
      issues.push("Số lượng kho không hợp lệ.");
    }
    if (
      variantDraft.enableCustom &&
      !variantDraft.customName.trim() &&
      variantDraft.customValues.length > 0
    ) {
      issues.push("Thuộc tính khác cần có tên.");
    }
    if (
      variantDraft.enableStyle &&
      variantDraft.styleValues.length === 0 &&
      variantDraft.styleInput.trim()
    ) {
      issues.push("Nhấn Enter hoặc 'Thêm ô khác' để lưu kiểu dáng đang nhập.");
    }
    if (
      variantDraft.enableColor &&
      variantDraft.colorValues.length === 0 &&
      variantDraft.colorInput.trim()
    ) {
      issues.push("Nhấn Enter hoặc 'Thêm ô khác' để lưu màu sắc đang nhập.");
    }
    if (
      variantDraft.enableCustom &&
      variantDraft.customValues.length === 0 &&
      variantDraft.customInput.trim()
    ) {
      issues.push(
        "Nhấn Enter hoặc 'Thêm ô khác' để lưu giá trị thuộc tính đang nhập.",
      );
    }
    return issues;
  }, [
    product.name,
    product.price,
    product.stock,
    variantDraft.enableCustom,
    variantDraft.customName,
    variantDraft.customValues.length,
    variantDraft.enableStyle,
    variantDraft.styleValues.length,
    variantDraft.styleInput,
    variantDraft.enableColor,
    variantDraft.colorValues.length,
    variantDraft.colorInput,
    variantDraft.customInput,
  ]);
  const canSubmit =
    !loading &&
    !uploadingImage &&
    !uploadingVideo &&
    validationIssues.length === 0;
  const fieldErrors = useMemo(() => {
    return {
      name: !product.name.trim() ? "Tên sản phẩm là bắt buộc." : "",
      price: product.price <= 0 ? "Giá bán phải lớn hơn 0." : "",
      stock: product.stock < 0 ? "Số lượng kho không hợp lệ." : "",
      image:
        product.images.length === 0 && !product.image
          ? "Cần ít nhất 1 hình ảnh sản phẩm."
          : "",
      customName:
        variantDraft.enableCustom &&
        variantDraft.customValues.length > 0 &&
        !variantDraft.customName.trim()
          ? "Vui lòng nhập tên cho thuộc tính khác."
          : "",
    };
  }, [
    product.name,
    product.price,
    product.stock,
    product.images.length,
    product.image,
    variantDraft.enableCustom,
    variantDraft.customValues.length,
    variantDraft.customName,
  ]);
  const completionTone = useMemo(() => {
    if (formCompletion >= 80) {
      return {
        badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        barClass: "bg-emerald-500",
        label: "Sẵn sàng lưu",
      };
    }
    if (formCompletion >= 45) {
      return {
        badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
        barClass: "bg-amber-500",
        label: "Khá tốt",
      };
    }
    return {
      badgeClass: "bg-red-50 text-red-700 border border-red-200",
      barClass: "bg-red-500",
      label: "Cần bổ sung",
    };
  }, [formCompletion]);
  const completionChecklist = useMemo(
    () => [
      {
        key: "name",
        label: "Tên sản phẩm",
        done: !!product.name.trim(),
      },
      {
        key: "price",
        label: "Giá bán",
        done: product.price > 0,
      },
      {
        key: "stock",
        label: "Kho hàng",
        done: product.stock >= 0,
      },
      {
        key: "image",
        label: "Hình ảnh",
        done: !!product.image || product.images.length > 0,
      },
      {
        key: "variants",
        label: "Thuộc tính",
        done:
          !variantDraft.enableStyle &&
          !variantDraft.enableColor &&
          !variantDraft.enableCustom
            ? true
            : totalVariantValues > 0,
      },
    ],
    [
      product.name,
      product.price,
      product.stock,
      product.image,
      product.images.length,
      variantDraft.enableStyle,
      variantDraft.enableColor,
      variantDraft.enableCustom,
      totalVariantValues,
    ],
  );

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "info") => {
      setToast({ message, type });
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);
    },
    [],
  );

  const scrollToSection = useCallback(
    (section: "basic" | "price" | "media" | "variant") => {
      setActiveSection(section);
      const target =
        section === "basic"
          ? basicSectionRef.current
          : section === "price"
            ? priceSectionRef.current
            : section === "media"
              ? mediaSectionRef.current
              : variantSectionRef.current;
      if (!target) return;
      const targetTop =
        target.getBoundingClientRect().top +
        window.scrollY -
        MOBILE_STICKY_OFFSET;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    },
    [],
  );

  useEffect(() => {
    const entries: Array<{
      key: "basic" | "price" | "media" | "variant";
      ref: React.RefObject<HTMLDivElement | null>;
    }> = [
      { key: "basic", ref: basicSectionRef },
      { key: "price", ref: priceSectionRef },
      { key: "media", ref: mediaSectionRef },
      { key: "variant", ref: variantSectionRef },
    ];
    const observer = new IntersectionObserver(
      (observed) => {
        let bestSection: "basic" | "price" | "media" | "variant" | null = null;
        let bestRatio = 0;
        observed.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entries.find(
            (candidate) => candidate.ref.current === entry.target,
          );
          if (!section) return;
          if (entry.intersectionRatio >= bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestSection = section.key;
          }
        });
        if (bestSection) {
          setActiveSection(bestSection);
        }
      },
      {
        root: null,
        rootMargin: "-140px 0px -45% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    entries.forEach((entry) => {
      if (entry.ref.current) {
        observer.observe(entry.ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = sectionTabsRef.current;
    if (!container) return;
    const activeTab = container.querySelector<HTMLButtonElement>(
      `[data-section="${activeSection}"]`,
    );
    if (!activeTab) return;
    activeTab.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSection]);

  const scrollAndFocus = (element?: HTMLElement | null) => {
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-2", "ring-red-300", "ring-offset-2");
    window.setTimeout(() => {
      element.classList.remove("ring-2", "ring-red-300", "ring-offset-2");
    }, 900);
    if (typeof window !== "undefined" && "animate" in element) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!prefersReducedMotion) {
        element.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-6px)" },
            { transform: "translateX(6px)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(4px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 320, easing: "ease-in-out" },
        );
      }
    }
    if ("focus" in element) {
      window.setTimeout(() => {
        element.focus();
      }, 120);
    }
  };

  const focusFirstInvalidField = useCallback(() => {
    if (fieldErrors.name) {
      scrollAndFocus(nameInputRef.current);
      return;
    }
    if (fieldErrors.price) {
      scrollAndFocus(priceInputRef.current);
      return;
    }
    if (fieldErrors.stock) {
      scrollAndFocus(stockInputRef.current);
      return;
    }
    if (fieldErrors.image) {
      scrollAndFocus(imageSectionRef.current);
      return;
    }
    if (fieldErrors.customName) {
      scrollAndFocus(customNameInputRef.current);
    }
  }, [fieldErrors]);

  const isStyleGroupName = (name: string) => {
    const normalized = name.trim().toLowerCase();
    return (
      normalized === "kiểu dáng" ||
      normalized === "kieu dang" ||
      normalized === "style"
    );
  };

  const isColorGroupName = (name: string) => {
    const normalized = name.trim().toLowerCase();
    return (
      normalized === "màu sắc" ||
      normalized === "mau sac" ||
      normalized === "màu" ||
      normalized === "mau" ||
      normalized === "color"
    );
  };

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const res = await productApi.getById(id);
          setProduct({
            name: res.data.name,
            price: res.data.price,
            originalPrice: res.data.originalPrice,
            discount: res.data.discount,
            image: res.data.image || "",
            images:
              Array.isArray(res.data.images) && res.data.images.length > 0
                ? res.data.images
                : res.data.image
                  ? [res.data.image]
                  : [],
            videos: Array.isArray(res.data.videos) ? res.data.videos : [],
            category: res.data.category || CATEGORIES[0].name,
            isMall: !!res.data.isMall,
            stock: res.data.stock ?? 0,
            description: res.data.description || "",
            detailSpecs: Array.isArray(res.data.detailSpecs)
              ? res.data.detailSpecs
              : [],
            optionGroups: Array.isArray(res.data.optionGroups)
              ? res.data.optionGroups
              : [],
          });
          const optionGroups = Array.isArray(res.data.optionGroups)
            ? res.data.optionGroups
            : [];
          const styleGroup = optionGroups.find(
            (group: { name?: string }) =>
              typeof group?.name === "string" && isStyleGroupName(group.name),
          );
          const colorGroup = optionGroups.find(
            (group: { name?: string }) =>
              typeof group?.name === "string" && isColorGroupName(group.name),
          );
          const customGroup = optionGroups.find(
            (group: { name?: string }) =>
              typeof group?.name === "string" &&
              !isStyleGroupName(group.name) &&
              !isColorGroupName(group.name),
          );
          setVariantDraft({
            enableStyle: !!styleGroup,
            styleValues: Array.isArray(styleGroup?.values)
              ? styleGroup.values
              : [],
            styleInput: "",
            enableColor: !!colorGroup,
            colorValues: Array.isArray(colorGroup?.values)
              ? colorGroup.values
              : [],
            colorInput: "",
            enableCustom: !!customGroup,
            customName:
              typeof customGroup?.name === "string" ? customGroup.name : "",
            customValues: Array.isArray(customGroup?.values)
              ? customGroup.values
              : [],
            customInput: "",
          });
        } catch (_err) {
          setError("Không thể tải thông tin sản phẩm");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (id || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ProductDraftPayload;
      if (!parsed || !parsed.product || !parsed.variantDraft) return;
      setProduct(parsed.product);
      setVariantDraft(parsed.variantDraft);
      setNewImageUrl(parsed.newImageUrl || "");
      setNewVideoUrl(parsed.newVideoUrl || "");
      setLastDraftSavedAt(parsed.savedAt || Date.now());
      setDraftRestored(true);
      showToast("Đã khôi phục dữ liệu nháp", "info");
    } catch {
      // Ignore broken draft payload.
    }
  }, [id, showToast]);

  useEffect(() => {
    if (id) return;
    const timer = window.setTimeout(() => {
      try {
        const payload: ProductDraftPayload = {
          product,
          variantDraft,
          newImageUrl,
          newVideoUrl,
          savedAt: Date.now(),
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
        setLastDraftSavedAt(payload.savedAt);
      } catch {
        // Ignore localStorage write errors.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [id, product, variantDraft, newImageUrl, newVideoUrl]);

  useEffect(() => {
    if (id) return;
    const meaningfulData =
      !!product.name.trim() ||
      !!product.description.trim() ||
      product.images.length > 0 ||
      product.videos.length > 0 ||
      totalVariantValues > 0 ||
      product.price > 0;
    setIsDirty(meaningfulData);
  }, [
    id,
    product.name,
    product.description,
    product.images.length,
    product.videos.length,
    product.price,
    totalVariantValues,
  ]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập");

      const formData = new FormData();
      formData.append("image", file);

      const res = await productApi.uploadProductImage(formData, token);
      const nextUrl = res.data.imageUrl;
      setProduct((prev) => {
        const nextImages = prev.images.includes(nextUrl)
          ? prev.images
          : [...prev.images, nextUrl];
        const nextPrimary = prev.image || nextImages[0] || nextUrl;
        return { ...prev, image: nextPrimary, images: nextImages };
      });
      showToast("Đã tải ảnh lên thành công", "success");
    } catch (_err) {
      setError("Không thể tải ảnh lên. Vui lòng thử lại.");
      showToast("Tải ảnh thất bại", "error");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập");

      const formData = new FormData();
      formData.append("video", file);

      const res = await productApi.uploadProductVideo(formData, token);
      const nextUrl = res.data.videoUrl;
      setProduct((prev) => ({
        ...prev,
        videos: prev.videos.includes(nextUrl)
          ? prev.videos
          : [...prev.videos, nextUrl],
      }));
      showToast("Đã tải video lên thành công", "success");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Không thể tải video lên. Vui lòng thử lại.";
      setError(message);
      showToast(message, "error");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setProduct({ ...product, [name]: checked });
    } else if (type === "number") {
      setProduct({ ...product, [name]: Number(value) });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select full value so initial "0" is replaced immediately when user types.
    e.currentTarget.select();
  };

  const addImageByUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setProduct((prev) => {
      const nextImages = prev.images.includes(url)
        ? prev.images
        : [...prev.images, url];
      return {
        ...prev,
        image: prev.image || nextImages[0] || "",
        images: nextImages,
      };
    });
    setNewImageUrl("");
  };

  const addVideoByUrl = () => {
    const url = newVideoUrl.trim();
    if (!url) return;
    setProduct((prev) => ({
      ...prev,
      videos: prev.videos.includes(url) ? prev.videos : [...prev.videos, url],
    }));
    setNewVideoUrl("");
  };

  const handleEnterAdd =
    (action: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      action();
    };

  const removeImage = (url: string) => {
    setProduct((prev) => {
      const nextImages = prev.images.filter((item) => item !== url);
      const nextPrimary = prev.image === url ? nextImages[0] || "" : prev.image;
      return { ...prev, image: nextPrimary, images: nextImages };
    });
  };

  const removeVideo = (url: string) => {
    setProduct((prev) => ({
      ...prev,
      videos: prev.videos.filter((item) => item !== url),
    }));
  };

  const setPrimaryImage = (url: string) => {
    setProduct((prev) => ({ ...prev, image: url }));
  };

  const addVariantValue = (type: "style" | "color" | "custom") => {
    setVariantDraft((prev) => {
      const keyInput =
        type === "style"
          ? "styleInput"
          : type === "color"
            ? "colorInput"
            : "customInput";
      const keyValues =
        type === "style"
          ? "styleValues"
          : type === "color"
            ? "colorValues"
            : "customValues";
      const value = prev[keyInput].trim();
      if (!value) return prev;
      if (prev[keyValues].includes(value)) {
        return { ...prev, [keyInput]: "" };
      }
      return {
        ...prev,
        [keyValues]: [...prev[keyValues], value],
        [keyInput]: "",
      };
    });
  };

  const removeVariantValue = (
    type: "style" | "color" | "custom",
    value: string,
  ) => {
    setVariantDraft((prev) => {
      const keyValues =
        type === "style"
          ? "styleValues"
          : type === "color"
            ? "colorValues"
            : "customValues";
      return {
        ...prev,
        [keyValues]: prev[keyValues].filter((item) => item !== value),
      };
    });
  };

  const handleAddSpec = () => {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) {
      showToast("Vui lòng nhập cả nhãn và giá trị", "error");
      return;
    }
    setProduct((prev) => ({
      ...prev,
      detailSpecs: [
        ...(prev.detailSpecs || []),
        { label: newSpecLabel.trim(), value: newSpecValue.trim() },
      ],
    }));
    setNewSpecLabel("");
    setNewSpecValue("");
    setIsDirty(true);
  };

  const handleRemoveSpec = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      detailSpecs: (prev.detailSpecs || []).filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      showToast("Vui lòng sửa các trường đang báo lỗi", "error");
      focusFirstInvalidField();
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const mergedImages = Array.from(
        new Set([product.image, ...product.images].filter(Boolean)),
      );
      const primaryImage = mergedImages[0] || "";
      if (!primaryImage) {
        setError("Vui lòng thêm ít nhất 1 hình ảnh sản phẩm.");
        showToast("Vui lòng thêm ít nhất 1 hình ảnh sản phẩm", "error");
        setLoading(false);
        return;
      }
      const payload = {
        ...product,
        image: primaryImage,
        images: mergedImages,
        optionGroups: [
          ...(variantDraft.enableStyle && variantDraft.styleValues.length > 0
            ? [{ name: "Kiểu dáng", values: variantDraft.styleValues }]
            : []),
          ...(variantDraft.enableColor && variantDraft.colorValues.length > 0
            ? [{ name: "Màu sắc", values: variantDraft.colorValues }]
            : []),
          ...(variantDraft.enableCustom &&
          variantDraft.customName.trim() &&
          variantDraft.customValues.length > 0
            ? [
                {
                  name: variantDraft.customName.trim(),
                  values: variantDraft.customValues,
                },
              ]
            : []),
        ],
      };
      if (id) {
        await productApi.update(id, payload, token || "");
        showToast("Cập nhật sản phẩm thành công", "success");
      } else {
        await productApi.create(payload, token || "");
        localStorage.removeItem(draftKey);
        setLastDraftSavedAt(null);
        setIsDirty(false);
        showToast("Thêm sản phẩm mới thành công", "success");
      }
      navigate("/admin/products");
    } catch (_err) {
      setError("Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.");
      showToast("Lưu sản phẩm thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearDraft = () => {
    if (id) return;
    localStorage.removeItem(draftKey);
    setLastDraftSavedAt(null);
    setDraftRestored(false);
    setProduct({
      name: "",
      price: 0,
      originalPrice: 0,
      discount: 0,
      image: "",
      images: [],
      videos: [],
      category: CATEGORIES[0].name,
      isMall: false,
      stock: 0,
      description: "",
      detailSpecs: [],
      optionGroups: [],
    });
    setVariantDraft({
      enableStyle: false,
      styleValues: [],
      styleInput: "",
      enableColor: false,
      colorValues: [],
      colorInput: "",
      enableCustom: false,
      customName: "",
      customValues: [],
      customInput: "",
    });
    setNewImageUrl("");
    setNewVideoUrl("");
    setIsDirty(false);
    showToast("Đã xóa nháp", "info");
  };

  if (loading && id) {
    return (
      <div className="min-h-[600px] max-w-4xl mx-auto py-10">
        <div className="flex items-center gap-4 mb-8 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-neutral-quaternary"></div>
          <div className="h-8 w-64 rounded-lg bg-neutral-quaternary"></div>
        </div>
        <GlassListSkeleton
          rows={12}
          variant="full"
          className="w-full"
          minHeight="min-h-[700px]"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-40 md:pb-28">
      <div className="flex items-start md:items-center justify-between gap-3 mb-5 md:mb-6">
        <div className="flex items-start md:items-center gap-3 md:gap-4 min-w-0">
          <button
            onClick={() => navigate("/admin/products")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="md:w-6 md:h-6" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              {id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Điền thông tin bên dưới để sản phẩm hiển thị chuyên nghiệp hơn.
            </p>
          </div>
        </div>
        <span className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-shopbee-blue/10 text-shopbee-blue text-xs font-semibold">
          <Sparkles size={14} />
          Form thông minh
        </span>
      </div>

      <div className="mb-5 md:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl border border-shopbee-blue/20 bg-shopbee-blue/5 px-3 py-2 text-shopbee-blue font-semibold">
          1. Thông tin cơ bản
        </div>
        <div className="rounded-xl border border-gray-200 px-3 py-2 text-gray-600">
          2. Ảnh, video, thuộc tính
        </div>
        <div className="rounded-xl border border-gray-200 px-3 py-2 text-gray-600">
          3. Kiểm tra và lưu
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] md:text-xs">
        {!id && lastDraftSavedAt && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã lưu nháp lúc{" "}
            {new Date(lastDraftSavedAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        {!id && draftRestored && (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Đã khôi phục nội dung nháp
          </span>
        )}
        <span
          className={`px-2.5 py-1 rounded-full ${completionTone.badgeClass}`}
        >
          Hoàn thiện: {formCompletion}% · {completionTone.label}
        </span>
      </div>
      <div className="mb-5 md:mb-6">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${completionTone.barClass}`}
            style={{ width: `${formCompletion}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {completionChecklist.map((item) => (
            <span
              key={item.key}
              className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border ${
                item.done
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {item.done ? (
                <CheckCircle2 size={12} />
              ) : (
                <AlertCircle size={12} />
              )}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}
      {toast && (
        <div className="fixed top-[4.25rem] left-1/2 -translate-x-1/2 md:top-4 md:right-4 md:left-auto md:translate-x-0 z-50 px-3 md:px-0 w-full md:w-auto flex justify-center md:block">
          <div
            className={`rounded-xl border px-4 py-3 shadow-lg backdrop-blur flex items-center gap-2 text-sm w-full max-w-[92vw] md:max-w-none ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-700"
                : toast.type === "error"
                  ? "bg-red-50/95 border-red-200 text-red-700"
                  : "bg-blue-50/95 border-blue-200 text-blue-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <Info size={16} />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="md:hidden sticky top-[3.5rem] z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur rounded-xl border border-gray-200 dark:border-slate-800 p-2 -mt-1">
          <div
            ref={sectionTabsRef}
            className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              data-section="basic"
              onClick={() => scrollToSection("basic")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                activeSection === "basic"
                  ? "bg-shopbee-blue text-white border-shopbee-blue shadow-sm scale-[1.02]"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cơ bản
            </button>
            <button
              type="button"
              data-section="price"
              onClick={() => scrollToSection("price")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                activeSection === "price"
                  ? "bg-shopbee-blue text-white border-shopbee-blue shadow-sm scale-[1.02]"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Giá
            </button>
            <button
              type="button"
              data-section="media"
              onClick={() => scrollToSection("media")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                activeSection === "media"
                  ? "bg-shopbee-blue text-white border-shopbee-blue shadow-sm scale-[1.02]"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Ảnh/Video
            </button>
            <button
              type="button"
              data-section="variant"
              onClick={() => scrollToSection("variant")}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                activeSection === "variant"
                  ? "bg-shopbee-blue text-white border-shopbee-blue shadow-sm scale-[1.02]"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Phân loại
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div
              ref={basicSectionRef}
              className="scroll-mt-32 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package size={20} className="text-shopbee-blue" />
                Thông tin cơ bản
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tên sản phẩm
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="name"
                    required
                    placeholder="Nhập tên sản phẩm..."
                    value={product.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.name
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 dark:border-gray-700 focus:ring-shopbee-blue/50"
                    }`}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Tên rõ ràng giúp sản phẩm dễ tìm kiếm hơn.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {product.name.trim().length}/120 ký tự
                  </p>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    value={product.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    {product.description.trim().length} ký tự
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-shopbee-blue" />
                    Thông tin chi tiết (Thông số kỹ thuật)
                  </label>

                  <div className="space-y-3 mb-4">
                    {(product.detailSpecs || []).map((spec, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 group"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {spec.label}
                          </div>
                          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white">
                            {spec.value}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Nhãn (VD: Chất liệu)"
                        value={newSpecLabel}
                        onChange={(e) => setNewSpecLabel(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-shopbee-blue/50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Giá trị (VD: Cotton)"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-shopbee-blue/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-1.5 bg-shopbee-blue/10 text-shopbee-blue hover:bg-shopbee-blue/20 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    Gợi ý: Thương hiệu, Xuất xứ, Chất liệu, Bảo hành, Kích
                    thước...
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={priceSectionRef}
              className="scroll-mt-32 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-shopbee-blue" />
                Giá & Kho hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Giá bán (₫)
                  </label>
                  <input
                    ref={priceInputRef}
                    type="number"
                    name="price"
                    required
                    min="0"
                    value={product.price}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    className={`w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.price
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 dark:border-gray-700 focus:ring-shopbee-blue/50"
                    }`}
                  />
                  {fieldErrors.price && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {fieldErrors.price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Giá gốc (₫)
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    min="0"
                    value={product.originalPrice}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Số lượng trong kho
                  </label>
                  <input
                    ref={stockInputRef}
                    type="number"
                    name="stock"
                    required
                    min="0"
                    value={product.stock}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    className={`w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 ${
                      fieldErrors.stock
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 dark:border-gray-700 focus:ring-shopbee-blue/50"
                    }`}
                  />
                  {fieldErrors.stock && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {fieldErrors.stock}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    max="100"
                    value={product.discount}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
                  />
                  {estimatedDiscount > 0 && (
                    <p className="text-[11px] text-emerald-600 mt-1">
                      Gợi ý từ giá gốc: khoảng {estimatedDiscount}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                <Info size={18} className="text-shopbee-blue" />
                Tóm tắt nhanh
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Ảnh đã thêm</span>
                  <span className="font-semibold">{product.images.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Video đã thêm</span>
                  <span className="font-semibold">{product.videos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Giá trị thuộc tính</span>
                  <span className="font-semibold">{totalVariantValues}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Giá hiển thị</span>
                  <span className="font-bold text-shopbee-blue">
                    ₫{Number(product.price || 0).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            <div
              ref={mediaSectionRef}
              className="scroll-mt-32 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-shopbee-blue" />
                Ảnh & Video
              </h2>
              <div className="space-y-4">
                <div
                  ref={imageSectionRef}
                  className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700"
                  tabIndex={-1}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon
                        className="mx-auto text-gray-300 mb-2"
                        size={40}
                      />
                      <p className="text-xs text-gray-400">
                        Xem trước hình ảnh
                      </p>
                    </div>
                  )}
                </div>
                {fieldErrors.image && (
                  <p className="text-[11px] text-red-500 -mt-2">
                    {fieldErrors.image}
                  </p>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Hình ảnh sản phẩm (nhiều ảnh)
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <div className="w-full px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {uploadingImage ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-shopbee-blue animate-pulse" />
                          ) : (
                            <Upload size={18} className="text-shopbee-blue" />
                          )}
                          <span>Tải ảnh lên từ thiết bị</span>
                        </div>
                      </label>
                    </div>
                    {product.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {product.images.map((url) => (
                          <div
                            key={url}
                            className="relative rounded-xl overflow-hidden border"
                          >
                            <img
                              src={url}
                              alt="Ảnh sản phẩm"
                              className="w-full h-20 object-cover"
                            />
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(url)}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  product.image === url
                                    ? "bg-shopbee-blue text-white"
                                    : "bg-white/90 text-gray-700"
                                }`}
                              >
                                Chính
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ImageIcon size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Thêm URL hình ảnh..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={handleEnterAdd(addImageByUrl)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addImageByUrl}
                      className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                    >
                      Thêm ảnh từ URL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Video sản phẩm
                  </label>
                  <div className="flex flex-col gap-3">
                    <label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {uploadingVideo ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-shopbee-blue animate-pulse" />
                        ) : (
                          <Video size={18} className="text-shopbee-blue" />
                        )}
                        <span>Tải video lên từ thiết bị</span>
                      </div>
                    </label>
                    {product.videos.length > 0 && (
                      <div className="space-y-2">
                        {product.videos.map((url) => (
                          <div
                            key={url}
                            className="relative rounded-xl overflow-hidden border p-2 bg-gray-50"
                          >
                            <video
                              src={url}
                              controls
                              className="w-full h-28 rounded-lg bg-black"
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(url)}
                              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Thêm URL video..."
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      onKeyDown={handleEnterAdd(addVideoByUrl)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addVideoByUrl}
                      className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                    >
                      Thêm video từ URL
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={variantSectionRef}
              className="scroll-mt-32 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Layers size={20} className="text-shopbee-blue" />
                Phân loại
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Danh mục
                  </label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-shopbee-blue/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <input
                    type="checkbox"
                    id="isMall"
                    name="isMall"
                    checked={product.isMall}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-shopbee-blue focus:ring-shopbee-blue cursor-pointer"
                  />
                  <label
                    htmlFor="isMall"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Sản phẩm ShopBee Mall
                  </label>
                </div>
                <div className="space-y-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thuộc tính sản phẩm
                  </p>

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={variantDraft.enableStyle}
                      onChange={(e) =>
                        setVariantDraft((prev) => ({
                          ...prev,
                          enableStyle: e.target.checked,
                        }))
                      }
                    />
                    <span className="inline-flex items-center gap-1">
                      <Ruler size={14} className="text-shopbee-blue" />
                      Kiểu dáng
                    </span>
                  </label>
                  {variantDraft.enableStyle && (
                    <div className="pl-2 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập kiểu dáng..."
                          value={variantDraft.styleInput}
                          onChange={(e) =>
                            setVariantDraft((prev) => ({
                              ...prev,
                              styleInput: e.target.value,
                            }))
                          }
                          onKeyDown={handleEnterAdd(() =>
                            addVariantValue("style"),
                          )}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addVariantValue("style")}
                          className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                        >
                          Thêm ô khác
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantDraft.styleValues.map((value) => (
                          <span
                            key={value}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-shopbee-blue/10 text-shopbee-blue text-xs"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeVariantValue("style", value)}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={variantDraft.enableColor}
                      onChange={(e) =>
                        setVariantDraft((prev) => ({
                          ...prev,
                          enableColor: e.target.checked,
                        }))
                      }
                    />
                    <span className="inline-flex items-center gap-1">
                      <Palette size={14} className="text-emerald-600" />
                      Màu sắc
                    </span>
                  </label>
                  {variantDraft.enableColor && (
                    <div className="pl-2 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập màu sắc..."
                          value={variantDraft.colorInput}
                          onChange={(e) =>
                            setVariantDraft((prev) => ({
                              ...prev,
                              colorInput: e.target.value,
                            }))
                          }
                          onKeyDown={handleEnterAdd(() =>
                            addVariantValue("color"),
                          )}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addVariantValue("color")}
                          className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                        >
                          Thêm ô khác
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantDraft.colorValues.map((value) => (
                          <span
                            key={value}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => removeVariantValue("color", value)}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={variantDraft.enableCustom}
                      onChange={(e) =>
                        setVariantDraft((prev) => ({
                          ...prev,
                          enableCustom: e.target.checked,
                        }))
                      }
                    />
                    Thuộc tính khác
                  </label>
                  {variantDraft.enableCustom && (
                    <div className="pl-2 space-y-2">
                      <input
                        ref={customNameInputRef}
                        type="text"
                        placeholder="Tên thuộc tính (VD: Kích thước)"
                        value={variantDraft.customName}
                        onChange={(e) =>
                          setVariantDraft((prev) => ({
                            ...prev,
                            customName: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-gray-900 text-sm ${
                          fieldErrors.customName
                            ? "border-red-300"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {fieldErrors.customName && (
                        <p className="text-[11px] text-red-500">
                          {fieldErrors.customName}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập giá trị thuộc tính..."
                          value={variantDraft.customInput}
                          onChange={(e) =>
                            setVariantDraft((prev) => ({
                              ...prev,
                              customInput: e.target.value,
                            }))
                          }
                          onKeyDown={handleEnterAdd(() =>
                            addVariantValue("custom"),
                          )}
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => addVariantValue("custom")}
                          className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                        >
                          Thêm ô khác
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variantDraft.customValues.map((value) => (
                          <span
                            key={value}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 text-violet-700 text-xs"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() =>
                                removeVariantValue("custom", value)
                              }
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed left-0 right-0 bottom-0 z-20 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-3 py-2 md:px-4 md:py-3 md:left-64 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <div className="max-w-5xl mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-600">
              {validationIssues.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 size={14} />
                  Sẵn sàng lưu
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <AlertCircle size={14} />
                  Còn {validationIssues.length} mục cần hoàn thiện
                </span>
              )}
            </div>
            <div className="flex gap-2 md:flex md:justify-end md:gap-4 w-full md:w-auto">
              {!id && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="flex-1 md:flex-none px-3 py-2 rounded-xl border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors text-xs md:text-sm font-semibold"
                >
                  Xóa nháp
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="flex-1 md:flex-none px-3 md:px-6 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs md:text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex-1 md:flex-none liquid-btn text-white font-bold py-2 px-3 md:px-8 rounded-xl flex items-center justify-center gap-2 text-xs md:text-sm ${
                  !canSubmit ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <Save size={20} />
                )}
                {id ? "Cập nhật sản phẩm" : "Lưu sản phẩm"}
              </button>
            </div>
          </div>
          {validationIssues.length > 0 && (
            <div className="max-w-5xl mx-auto mt-1 text-[11px] text-amber-700">
              {validationIssues[0]}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;



