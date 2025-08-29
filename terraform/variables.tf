variable "ssh_key_name" {
  description = "Name of the EC2 key pair to use for SSH (must already exist in AWS, or be created by Terraform)"
  type        = string
}

variable "docker_image" {
  description = "Docker image to run on the instance"
  type        = string
  default     = "chipsterz/astro-spa:latest"
}

variable "dockerhub_username" {
  description = "Docker Hub username (optional)"
  type        = string
  default     = "chipsterz"
}
