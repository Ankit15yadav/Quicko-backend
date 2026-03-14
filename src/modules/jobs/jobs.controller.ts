import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CreateJobDTO } from "./dto";

@Controller('jobs')
export class JobsController {

    @Get(':id')
    // @UseFilters(AppExceptionFilter)
    findJobById(@Param('id', ParseIntPipe) id: number) {
        if (id <= 0) {
            throw new BadRequestException();
        }

        return { success: true, id }
    }

    @Post()
    createJob(@Body() createJobDto: CreateJobDTO) {

    }
} 