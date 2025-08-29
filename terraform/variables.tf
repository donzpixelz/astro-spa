variable "dockerhub_username" {
  description = "Docker Hub username"
  type        = string
  default     = "chipsterz"
}

variable "docker_image" {
  description = "Docker image to run on the instance"
  type        = string
  # Point this at the astro-spa image for this project
  default     = "chipsterz/astro-spa:latest"
}
