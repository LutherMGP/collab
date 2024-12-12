// @/utils/filePaths.ts

export const FilePaths = {
    // Hent sti for cover images
    coverImage: (
      userId: string,
      projectId: string,
      category: "f8" | "f5" | "f3" | "f2",
      resolution: "LowRes" | "HighRes"
    ) =>
      `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImage${resolution}.jpeg`,
  
    // Hent sti for PDF
    pdf: (
      userId: string,
      projectId: string,
      category: "f8" | "f5" | "f3" | "f2"
    ) => `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`,
  
    // Hent sti for projektbillede
    projectImage: (userId: string, projectId: string) =>
      `users/${userId}/projects/${projectId}/projectimage/projectImage.jpeg`,
  
    // Hent sti for mapper til attachments
    attachmentsFolder: (userId: string, projectId: string, type: "images" | "pdf" ) =>
      `users/${userId}/projects/${projectId}/data/attachments/${type}/`,
  };