package com.daivatech.ecommerce.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);

    private final Path uploadDir = Paths.get("./uploads/products").toAbsolutePath().normalize();
    private final Path reviewUploadDir = Paths.get("./uploads/reviews").toAbsolutePath().normalize();

    // Max dimensions for Product Detail Page (Crystal high-res zoom & view)
    private static final int PDP_MAX_WIDTH = 1200;
    private static final int PDP_MAX_HEIGHT = 1500;

    // Dimensions for Product Listing Page (Snappy, optimized card thumbnails)
    private static final int PLP_TARGET_WIDTH = 600;
    private static final int PLP_MAX_HEIGHT = 750;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
            Files.createDirectories(reviewUploadDir);
            log.info("Initialized product & review image directories at: {}, {}", uploadDir, reviewUploadDir);
        } catch (IOException e) {
            log.error("Could not initialize upload directory: {}", e.getMessage());
            throw new RuntimeException("Could not create upload folder", e);
        }
    }

    public UploadedImageDTO storeAndResize(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "product-image.jpg";
        }

        // Clean base name and generate unique token
        String baseToken = "prod_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);

        BufferedImage originalImage = null;
        try (InputStream in = file.getInputStream()) {
            originalImage = ImageIO.read(in);
        } catch (Exception ex) {
            log.warn("ImageIO could not decode image format for {}: {}", originalFilename, ex.getMessage());
        }

        if (originalImage == null) {
            // Safe fallback: store original file directly (e.g. for WEBP, SVG, or uncompressed formats)
            String ext = originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String rawFilename = baseToken + ext;
            File rawFile = uploadDir.resolve(rawFilename).toFile();
            file.transferTo(rawFile);

            log.info("Stored file directly via fallback: {} -> {}", originalFilename, rawFilename);

            UploadedImageDTO dto = new UploadedImageDTO();
            dto.setOriginalFileName(originalFilename);
            dto.setPdpUrl("/uploads/products/" + rawFilename);
            dto.setPlpUrl("/uploads/products/" + rawFilename);
            dto.setPdpWidth(1000);
            dto.setPdpHeight(1000);
            dto.setPlpWidth(500);
            dto.setPlpHeight(500);
            dto.setFileSize(rawFile.length());
            return dto;
        }

        int origWidth = originalImage.getWidth();
        int origHeight = originalImage.getHeight();

        // 1. Generate PDP Version (High-Resolution Detail View)
        Dimension pdpDim = calculateScale(origWidth, origHeight, PDP_MAX_WIDTH, PDP_MAX_HEIGHT);
        BufferedImage pdpImage = resizeImage(originalImage, pdpDim.width, pdpDim.height);
        String pdpFilename = baseToken + "_pdp.jpg";
        File pdpFile = uploadDir.resolve(pdpFilename).toFile();
        ImageIO.write(pdpImage, "jpg", pdpFile);

        // 2. Generate PLP Version (Card Thumbnail View)
        Dimension plpDim = calculateScale(origWidth, origHeight, PLP_TARGET_WIDTH, PLP_MAX_HEIGHT);
        BufferedImage plpImage = resizeImage(originalImage, plpDim.width, plpDim.height);
        String plpFilename = baseToken + "_plp.jpg";
        File plpFile = uploadDir.resolve(plpFilename).toFile();
        ImageIO.write(plpImage, "jpg", plpFile);

        log.info("Stored & auto-resized image {}: PDP ({}x{}), PLP ({}x{})",
                originalFilename, pdpDim.width, pdpDim.height, plpDim.width, plpDim.height);

        UploadedImageDTO dto = new UploadedImageDTO();
        dto.setOriginalFileName(originalFilename);
        dto.setPdpUrl("/uploads/products/" + pdpFilename);
        dto.setPlpUrl("/uploads/products/" + plpFilename);
        dto.setPdpWidth(pdpDim.width);
        dto.setPdpHeight(pdpDim.height);
        dto.setPlpWidth(plpDim.width);
        dto.setPlpHeight(plpDim.height);
        dto.setFileSize(pdpFile.length() + plpFile.length());

        return dto;
    }

    public List<UploadedImageDTO> storeAndResizeMultiple(MultipartFile[] files) throws IOException {
        List<UploadedImageDTO> results = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f != null && !f.isEmpty()) {
                results.add(storeAndResize(f));
            }
        }
        return results;
    }

    private Dimension calculateScale(int srcWidth, int srcHeight, int maxWidth, int maxHeight) {
        if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
            return new Dimension(srcWidth, srcHeight);
        }

        double widthRatio = (double) maxWidth / srcWidth;
        double heightRatio = (double) maxHeight / srcHeight;
        double ratio = Math.min(widthRatio, heightRatio);

        int targetWidth = Math.max(1, (int) Math.round(srcWidth * ratio));
        int targetHeight = Math.max(1, (int) Math.round(srcHeight * ratio));
        return new Dimension(targetWidth, targetHeight);
    }

    private BufferedImage resizeImage(BufferedImage src, int targetWidth, int targetHeight) {
        BufferedImage target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = target.createGraphics();

        // White background for transparent PNG/GIF to prevent black/red artifacts in JPEG
        g2.setColor(Color.WHITE);
        g2.fillRect(0, 0, targetWidth, targetHeight);

        // Professional bicubic downsampling hints
        g2.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);

        g2.drawImage(src, 0, 0, targetWidth, targetHeight, null);
        g2.dispose();
        return target;
    }

    /**
     * Stores customer uploaded review photo.
     */
    public String storeReviewImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty image.");
        }
        String ext = "jpg";
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
            if (!List.of("jpg", "jpeg", "png", "webp").contains(ext)) {
                ext = "jpg";
            }
        }
        String filename = "rev_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6) + "." + ext;
        Path targetPath = reviewUploadDir.resolve(filename);
        Files.copy(file.getInputStream(), targetPath);
        return "/api/reviews/images/" + filename;
    }

    public Path getReviewImagePath(String filename) {
        return reviewUploadDir.resolve(filename).normalize();
    }

    // Static DTO for response
    public static class UploadedImageDTO {
        private String originalFileName;
        private String pdpUrl;
        private String plpUrl;
        private int pdpWidth;
        private int pdpHeight;
        private int plpWidth;
        private int plpHeight;
        private long fileSize;

        public String getOriginalFileName() { return originalFileName; }
        public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

        public String getPdpUrl() { return pdpUrl; }
        public void setPdpUrl(String pdpUrl) { this.pdpUrl = pdpUrl; }

        public String getPlpUrl() { return plpUrl; }
        public void setPlpUrl(String plpUrl) { this.plpUrl = plpUrl; }

        public int getPdpWidth() { return pdpWidth; }
        public void setPdpWidth(int pdpWidth) { this.pdpWidth = pdpWidth; }

        public int getPdpHeight() { return pdpHeight; }
        public void setPdpHeight(int pdpHeight) { this.pdpHeight = pdpHeight; }

        public int getPlpWidth() { return plpWidth; }
        public void setPlpWidth(int plpWidth) { this.plpWidth = plpWidth; }

        public int getPlpHeight() { return plpHeight; }
        public void setPlpHeight(int plpHeight) { this.plpHeight = plpHeight; }

        public long getFileSize() { return fileSize; }
        public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    }
}
